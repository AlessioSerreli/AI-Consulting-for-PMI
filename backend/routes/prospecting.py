from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import asyncio
import httpx
from supabase import create_client

router = APIRouter(prefix="/prospecting")

APIFY_ACTOR = "nwua9Gu5YrADL7ZDj"
APIFY_BASE  = "https://api.apify.com/v2"
HUNTER_BASE = "https://api.hunter.io/v2"


def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise HTTPException(500, "Supabase not configured")
    return create_client(url, key)


def get_apify_token():
    token = os.getenv("APIFY_API_TOKEN")
    if not token:
        raise HTTPException(500, "APIFY_API_TOKEN non configurato nel .env")
    return token


EMPLOYEES_KEYWORDS = {
    "micro":   "micro impresa",
    "piccola": "piccola impresa",
    "media":   "media impresa",
}

REVENUE_LABELS = {
    "<500k":   "fatturato sotto 500k",
    "500k2m":  "fatturato 500k-2M",
    "2m10m":   "fatturato 2M-10M",
    ">10m":    "fatturato oltre 10M",
}


class SearchRequest(BaseModel):
    query: str                        # es. "officina meccanica"
    city: str                         # es. "Milano"
    max_results: int = 20
    employees: Optional[str] = None   # micro | piccola | media
    revenue: Optional[str] = None     # <500k | 500k2m | 2m10m | >10m


class LeadStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None


class BulkOutreachRequest(BaseModel):
    lead_ids: List[str]


class ManualLeadCreate(BaseModel):
    company_name: str
    owner_email: str
    owner_name: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None


@router.post("/run")
async def start_scraping(request: SearchRequest):
    token = get_apify_token()

    # Arricchisce la query con la dimensione aziendale se specificata
    parts = [request.query]
    if request.employees and request.employees in EMPLOYEES_KEYWORDS:
        parts.append(EMPLOYEES_KEYWORDS[request.employees])
    search_string = f"{' '.join(parts)} {request.city}"

    # Etichetta leggibile per i log / risposta
    revenue_label = REVENUE_LABELS.get(request.revenue or "", "")
    search_label = search_string + (f" | fatturato: {revenue_label}" if revenue_label else "")

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{APIFY_BASE}/acts/{APIFY_ACTOR}/runs",
            params={"token": token},
            json={
                "searchStringsArray": [search_string],
                "maxCrawledPlacesPerSearch": request.max_results,
                "language": "it",
                "countryCode": "it",
            },
        )
        if resp.status_code not in (200, 201):
            raise HTTPException(500, f"Errore Apify: {resp.text}")

        run_id = resp.json()["data"]["id"]
        return {"run_id": run_id, "status": "RUNNING", "search": search_label}


@router.get("/runs/{run_id}/status")
async def get_run_status(run_id: str):
    token = get_apify_token()

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{APIFY_BASE}/actor-runs/{run_id}",
            params={"token": token},
        )
        if resp.status_code != 200:
            raise HTTPException(404, "Run non trovato")

        data = resp.json()["data"]
        return {
            "run_id": run_id,
            "status": data["status"],   # RUNNING, SUCCEEDED, FAILED, TIMED-OUT
            "dataset_id": data.get("defaultDatasetId"),
        }


@router.get("/runs/{run_id}/results")
async def get_run_results(run_id: str, save: bool = Query(True)):
    token = get_apify_token()

    async with httpx.AsyncClient(timeout=30) as client:
        # Verifica stato run
        status_resp = await client.get(
            f"{APIFY_BASE}/actor-runs/{run_id}",
            params={"token": token},
        )
        if status_resp.status_code != 200:
            raise HTTPException(404, "Run non trovato")

        run_data = status_resp.json()["data"]
        if run_data["status"] != "SUCCEEDED":
            return {"status": run_data["status"], "results": []}

        dataset_id = run_data["defaultDatasetId"]

        # Scarica i risultati dal dataset
        items_resp = await client.get(
            f"{APIFY_BASE}/datasets/{dataset_id}/items",
            params={"token": token, "format": "json", "limit": 100},
        )
        items = items_resp.json()

    # Normalizza i campi restituiti da Google Maps Scraper
    leads = []
    for item in items:
        lead = {
            "company_name": item.get("title", ""),
            "category": item.get("categoryName", ""),
            "address": item.get("address", ""),
            "city": item.get("city") or item.get("neighborhood", ""),
            "phone": item.get("phone", ""),
            "website": item.get("website", ""),
            "email": item.get("email", ""),
            "rating": item.get("totalScore"),
            "review_count": item.get("reviewsCount", 0),
            "google_maps_url": item.get("url", ""),
            "apify_run_id": run_id,
            "status": "new",
        }
        if lead["company_name"]:
            leads.append(lead)

    # Salva su Supabase
    if save and leads:
        supabase = get_supabase()
        supabase.table("prospecting_leads").insert(leads).execute()

    return {"status": "SUCCEEDED", "count": len(leads), "results": leads}


@router.get("/leads")
async def get_prospecting_leads(
    status: Optional[str] = Query(None),
    limit: int = Query(50),
):
    supabase = get_supabase()
    q = (
        supabase.table("prospecting_leads")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
    )
    if status:
        q = q.eq("status", status)
    result = q.execute()
    return result.data


@router.post("/leads")
async def create_manual_lead(lead: ManualLeadCreate):
    supabase = get_supabase()
    data = lead.model_dump(exclude_none=True)
    data["status"] = "new"
    data["source"] = "manual"
    result = supabase.table("prospecting_leads").insert(data).execute()
    return result.data[0]


@router.patch("/leads/{lead_id}")
async def update_prospecting_lead(lead_id: str, update: LeadStatusUpdate):
    supabase = get_supabase()
    data = {"status": update.status}
    if update.notes:
        data["notes"] = update.notes
    result = supabase.table("prospecting_leads").update(data).eq("id", lead_id).execute()
    return result.data[0] if result.data else {}


async def _send_outreach_impl(lead_id: str) -> dict:
    """Logica core: invia email outreach + aggiorna DB. Raises Exception on failure."""
    resend_key = os.getenv("RESEND_API_KEY")
    if not resend_key:
        raise ValueError("RESEND_API_KEY non configurata")

    supabase = get_supabase()
    result = supabase.table("prospecting_leads").select("*").eq("id", lead_id).execute()
    if not result.data:
        raise ValueError(f"Lead {lead_id} non trovato")

    lead = result.data[0]
    owner_name   = lead.get("owner_name") or lead.get("company_name", "")
    owner_email  = lead.get("owner_email") or lead.get("email", "")
    company_name = lead.get("company_name", "")
    first_name   = owner_name.split()[0] if owner_name else "Imprenditore"

    if not owner_email:
        raise ValueError("Nessuna email disponibile (esegui prima l'enrich)")

    from urllib.parse import quote
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    survey_url = (
        f"{frontend_url}/survey"
        f"?ref={lead_id}"
        f"&name={quote(owner_name)}"
        f"&company={quote(company_name)}"
        f"&email={quote(owner_email)}"
    )

    html = f"""<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0"
       style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.10);">

  <tr><td style="background:#0A0F1E;padding:48px 48px 40px;">
    <p style="margin:0 0 28px;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#F59E0B;font-weight:700;">AI · PMI ITALIA</p>
    <p style="margin:0 0 16px;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(148,163,184,0.7);">Analisi gratuita</p>
    <h1 style="margin:0;font-size:32px;font-weight:700;line-height:1.2;color:#fff;">
      Scopri dove stai perdendo<br><span style="color:#F59E0B;">tempo e denaro</span> ogni giorno.
    </h1>
    <div style="width:48px;height:3px;background:#F59E0B;border-radius:2px;margin-top:28px;"></div>
  </td></tr>

  <tr><td style="padding:48px 48px 0;background:#fff;">
    <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.7;">
      Ciao <strong style="color:#0A0F1E;">{first_name}</strong>,
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#4B5563;line-height:1.8;">
      Ho analizzato <strong style="color:#0A0F1E;">{company_name}</strong> e penso ci siano margini concreti
      per ridurre il lavoro manuale e aumentare l'efficienza operativa con strumenti AI accessibili.
    </p>
    <p style="margin:0 0 24px;font-size:16px;color:#4B5563;line-height:1.8;">
      Ho preparato una <strong style="color:#0A0F1E;">diagnosi gratuita</strong> — 5 minuti di questionario,
      e ricevi un report personalizzato con il tuo punteggio di efficienza e 3 azioni concrete da implementare subito.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
      <tr><td style="padding:16px 20px;background:#F8FAFC;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="28" style="vertical-align:top;padding-top:1px;">
            <div style="width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;color:#0A0F1E;">1</div>
          </td>
          <td style="font-size:15px;color:#374151;line-height:1.6;padding-left:12px;">
            Il tuo <strong style="color:#0A0F1E;">punteggio di efficienza operativa</strong> vs le PMI del tuo settore
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="height:8px;"></td></tr>
      <tr><td style="padding:16px 20px;background:#F8FAFC;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="28" style="vertical-align:top;padding-top:1px;">
            <div style="width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;color:#0A0F1E;">2</div>
          </td>
          <td style="font-size:15px;color:#374151;line-height:1.6;padding-left:12px;">
            Le <strong style="color:#0A0F1E;">3 aree critiche</strong> con i quick win attivabili subito
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="height:8px;"></td></tr>
      <tr><td style="padding:16px 20px;background:#FFFBEB;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="28" style="vertical-align:top;padding-top:1px;">
            <div style="width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;color:#0A0F1E;">★</div>
          </td>
          <td style="font-size:15px;color:#374151;line-height:1.6;padding-left:12px;">
            Il <strong style="color:#0A0F1E;">Certificato di Efficienza Operativa</strong> — completamente gratuito
          </td>
        </tr></table>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:0 48px 48px;background:#fff;">
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="background:#0A0F1E;border-radius:10px;padding:18px 36px;">
        <a href="{survey_url}" style="font-size:16px;font-weight:700;color:#F59E0B;text-decoration:none;letter-spacing:0.02em;">
          Inizia la diagnosi gratuita →
        </a>
      </td>
    </tr></table>
    <p style="margin:12px 0 0;font-size:12px;color:#9CA3AF;">Oppure rispondi a questa email. Ti rispondo entro 24 ore.</p>
  </td></tr>

  <tr><td style="padding:0 48px;"><div style="height:1px;background:#E5E7EB;"></div></td></tr>
  <tr><td style="padding:36px 48px;background:#fff;">
    <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#0A0F1E;">Luigi Negro &amp; Alessio Serreli</p>
    <p style="margin:0 0 16px;font-size:13px;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;">AI Expert · Ottimizzazione Processi PMI</p>
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:24px;"><a href="tel:+393299576151" style="font-size:14px;color:#4B5563;text-decoration:none;">📞 +39 329 957 6151</a></td>
      <td><a href="mailto:luigi@aiconsultingpmi.it" style="font-size:14px;color:#F59E0B;text-decoration:none;">✉️ luigi@aiconsultingpmi.it</a></td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#0A0F1E;padding:20px 48px;">
    <p style="margin:0;font-size:11px;color:rgba(148,163,184,0.5);letter-spacing:0.08em;text-transform:uppercase;">
      © 2025 AI.PMI Italia — Puoi rispondere a questa email in qualsiasi momento
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>"""

    import resend
    resend.api_key = resend_key
    resend.Emails.send({
        "from": os.getenv("FROM_EMAIL", "onboarding@resend.dev"),
        "to": [owner_email],
        "subject": f"Ho analizzato {company_name} — diagnosi gratuita per te",
        "html": html,
    })

    supabase.table("prospecting_leads").update({
        "status": "contacted",
        "outreach_sent_at": datetime.utcnow().isoformat(),
    }).eq("id", lead_id).execute()

    # Inserisce il lead nella Pipeline CRM (leads) se non esiste già
    existing = supabase.table("leads").select("id").eq("contact_email", owner_email).execute()
    if existing.data:
        already_in_pipeline = True
    else:
        already_in_pipeline = False
        try:
            supabase.table("leads").insert({
                "company_name": company_name,
                "contact_name": owner_name,
                "contact_email": owner_email,
                "sector": lead.get("category") or "",
                "status": "new",
            }).execute()
        except Exception:
            pass

    return {"sent_to": owner_email, "survey_url": survey_url, "already_in_pipeline": already_in_pipeline}


@router.post("/leads/{lead_id}/outreach")
async def send_outreach(lead_id: str):
    """Invia email di outreach personalizzata con link alla survey pre-compilata."""
    try:
        result = await _send_outreach_impl(lead_id)
        return {"success": True, **result}
    except ValueError as e:
        msg = str(e)
        code = 404 if "non trovato" in msg else 400 if "Nessuna email" in msg else 500
        raise HTTPException(code, msg)
    except Exception as e:
        raise HTTPException(502, f"Errore invio email: {e}")


@router.post("/leads/bulk-outreach")
async def bulk_outreach(request: BulkOutreachRequest):
    """Invia email outreach a più lead in una sola chiamata."""
    results: dict = {"sent": [], "failed": []}
    for lead_id in request.lead_ids:
        try:
            await _send_outreach_impl(lead_id)
            results["sent"].append(lead_id)
        except Exception as e:
            results["failed"].append({"id": lead_id, "error": str(e)})
    return results


import re as _re

EMAIL_REGEX = _re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
SKIP_EMAILS = {'noreply', 'no-reply', 'donotreply', 'mailer', 'bounce', 'support@sentry',
               'webmaster', 'postmaster', 'abuse', 'spam', 'example', 'test@', 'email@'}

def _clean_emails(raw: list[str], domain: str) -> list[str]:
    """Filtra, deduplicazione e prioritizza email trovate sul sito."""
    seen, result = set(), []
    for e in raw:
        e = e.lower().strip()
        if e in seen: continue
        if any(skip in e for skip in SKIP_EMAILS): continue
        if len(e) > 80: continue
        seen.add(e)
        result.append(e)
    # Priorità: email con dominio aziendale > info@ > altri
    domain_clean = domain.replace('www.', '') if domain else ''
    priority = [e for e in result if domain_clean and domain_clean in e and not e.startswith('info@')]
    info     = [e for e in result if e.startswith('info@')]
    rest     = [e for e in result if e not in priority and e not in info]
    return priority + info + rest


async def _search_ddg_emails(company_name: str, city: str, client: httpx.AsyncClient) -> list[str]:
    """
    Cerca email azienda via DuckDuckGo:
    1. Ottiene i primi risultati di ricerca
    2. Visita le pagine linkate e cerca email nel contenuto
    """
    import re as _re2
    from urllib.parse import quote_plus
    LINK_RE = _re2.compile(r'class="result__url"[^>]*>([^<]+)<')
    HREF_RE = _re2.compile(r'href="//duckduckgo\.com/l/\?uddg=([^"&]+)')

    queries = [
        f'"{company_name}" {city} email contatti',
        f'"{company_name}" {city} contatti',
    ]
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept-Language': 'it-IT,it;q=0.9',
    }
    found = []

    for q in queries:
        try:
            ddg_url = f"https://html.duckduckgo.com/html/?q={quote_plus(q)}"
            resp = await client.get(ddg_url, headers=headers, follow_redirects=True, timeout=10)
            if resp.status_code != 200:
                continue

            # Prova prima a trovare email direttamente negli snippet
            direct = EMAIL_REGEX.findall(resp.text)
            found.extend(direct)

            # Estrai URL dei risultati e visita i primi 3
            from urllib.parse import unquote
            hrefs = HREF_RE.findall(resp.text)[:3]
            for raw_href in hrefs:
                page_url = unquote(raw_href)
                if not page_url.startswith('http'):
                    page_url = 'https://' + page_url
                try:
                    page = await client.get(page_url, headers=headers, follow_redirects=True, timeout=5)
                    if page.status_code == 200:
                        found.extend(EMAIL_REGEX.findall(page.text))
                except Exception:
                    continue

            if found:
                break
        except Exception:
            continue

    return _clean_emails(found, "")


async def _scrape_website_emails(website: str, client: httpx.AsyncClient) -> list[str]:
    """Scraping diretto del sito aziendale per trovare email."""
    if not website:
        return []
    base = website.rstrip('/')
    if '://' not in base:
        base = 'https://' + base

    pages_to_try = [
        base,
        base + '/contatti',
        base + '/contatti.html',
        base + '/contatti.php',
        base + '/contact',
        base + '/chi-siamo',
        base + '/about',
    ]

    found = []
    headers = {'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)'}
    domain = _extract_domain(website) or ''
    for url in pages_to_try:
        try:
            resp = await client.get(url, headers=headers, follow_redirects=True, timeout=5)
            if resp.status_code == 200:
                emails = EMAIL_REGEX.findall(resp.text)
                found.extend(emails)
                # Interrompi solo se abbiamo trovato email valide dopo il filtraggio
                # (evita di fermarsi su pagine con sole email di tracciamento/noreply)
                if _clean_emails(found, domain):
                    break
        except Exception:
            continue

    return _clean_emails(found, domain)


def _extract_domain(url: str) -> Optional[str]:
    """Estrae il dominio da un URL (es. https://www.example.it → example.it)."""
    if not url:
        return None
    url = url.strip().rstrip("/")
    if "://" not in url:
        url = "https://" + url
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith("www."):
            domain = domain[4:]
        return domain if "." in domain else None
    except Exception:
        return None


@router.post("/leads/{lead_id}/enrich")
async def enrich_lead(lead_id: str):
    """
    Arricchisce un lead con email usando 3 metodi in cascata:
    1. Scraping diretto del sito (homepage + /contatti) — gratuito
    2. Hunter.io domain-search — per siti strutturati
    Salva la prima email trovata su Supabase.
    """
    supabase = get_supabase()
    result = supabase.table("prospecting_leads").select("*").eq("id", lead_id).execute()
    if not result.data:
        raise HTTPException(404, "Lead non trovato")

    lead = result.data[0]
    website = lead.get("website", "")
    domain  = _extract_domain(website)
    source  = None
    contact = {}

    company_name = lead.get("company_name", "")
    city = lead.get("city", "")

    async with httpx.AsyncClient(timeout=15) as client:

        # ── STEP 1: scraping diretto del sito ──────────────────────────────
        if website:
            scraped = await _scrape_website_emails(website, client)
            if scraped:
                contact = {
                    "owner_email":    scraped[0],
                    "owner_name":     "",
                    "owner_position": "",
                    "hunter_domain":  domain or "",
                    "hunter_emails":  [{"email": e, "name": "", "position": ""} for e in scraped],
                }
                source = "website_scraping"

        # ── STEP 2: DuckDuckGo search ───────────────────────────────────────
        if not contact and company_name:
            ddg_emails = await _search_ddg_emails(company_name, city, client)
            if ddg_emails:
                contact = {
                    "owner_email":    ddg_emails[0],
                    "owner_name":     "",
                    "owner_position": "",
                    "hunter_domain":  domain or "",
                    "hunter_emails":  [{"email": e, "name": "", "position": ""} for e in ddg_emails],
                }
                source = "duckduckgo"

        # ── STEP 3: Hunter.io (fallback finale) ────────────────────────────
        if not contact and domain:
            hunter_key = os.getenv("HUNTER_API_KEY")
            if hunter_key:
                resp = await client.get(
                    f"{HUNTER_BASE}/domain-search",
                    params={"domain": domain, "api_key": hunter_key, "limit": 5},
                )
                if resp.status_code == 200:
                    emails = resp.json().get("data", {}).get("emails", [])
                    if emails:
                        prio = ["owner", "ceo", "founder", "co-founder", "director", "titolare", "amministratore"]
                        best = next(
                            (e for p in prio for e in emails if p in (e.get("position") or "").lower()),
                            emails[0]
                        )
                        contact = {
                            "owner_name":     f"{best.get('first_name','')} {best.get('last_name','')}".strip(),
                            "owner_email":    best.get("value", ""),
                            "owner_position": best.get("position", ""),
                            "hunter_domain":  domain,
                            "hunter_emails":  [{"email": e.get("value"), "name": f"{e.get('first_name','')} {e.get('last_name','')}".strip(), "position": e.get("position","")} for e in emails],
                        }
                        source = "hunter_io"

    if not contact:
        return {"enriched": False, "domain": domain, "reason": "Nessuna email trovata (sito non scrapabile e Hunter non ha risultati)"}

    try:
        supabase.table("prospecting_leads").update(contact).eq("id", lead_id).execute()
        saved = True
    except Exception:
        saved = False

    return {"enriched": True, "saved": saved, "source": source, "domain": domain, "contact": contact}


async def _enrich_single(lead: dict, client: httpx.AsyncClient, hunter_key: str) -> tuple[str, bool]:
    """
    Arricchisce un singolo lead con la cascata sito → DDG → Hunter.
    Ritorna (lead_id, enriched: bool).
    """
    supabase = get_supabase()
    lead_id      = lead["id"]
    website      = lead.get("website", "")
    company_name = lead.get("company_name", "")
    city         = lead.get("city", "")
    domain       = _extract_domain(website)
    contact: dict = {}

    # Step 1: scraping sito
    if website:
        try:
            scraped = await _scrape_website_emails(website, client)
            if scraped:
                contact = {"owner_email": scraped[0], "hunter_domain": domain or ""}
        except Exception:
            pass

    # Step 2: DuckDuckGo
    if not contact and company_name:
        try:
            ddg_emails = await _search_ddg_emails(company_name, city, client)
            if ddg_emails:
                contact = {"owner_email": ddg_emails[0], "hunter_domain": domain or ""}
        except Exception:
            pass

    # Step 3: Hunter.io fallback
    if not contact and domain and hunter_key:
        try:
            resp = await client.get(
                f"{HUNTER_BASE}/domain-search",
                params={"domain": domain, "api_key": hunter_key, "limit": 3},
                timeout=8,
            )
            emails = resp.json().get("data", {}).get("emails", [])
            if emails:
                best = emails[0]
                contact = {
                    "owner_name":    f"{best.get('first_name','')} {best.get('last_name','')}".strip(),
                    "owner_email":   best.get("value", ""),
                    "hunter_domain": domain,
                }
        except Exception:
            pass

    if not contact:
        return lead_id, False

    try:
        supabase.table("prospecting_leads").update(contact).eq("id", lead_id).execute()
        return lead_id, True
    except Exception:
        return lead_id, False


@router.post("/leads/enrich-all")
async def enrich_all_leads(limit: int = Query(10)):
    """
    Arricchisce i primi N lead non ancora enriched in parallelo.
    Tutti i lead vengono processati contemporaneamente — velocità ~10x rispetto alla versione sequenziale.
    """
    supabase = get_supabase()
    result = (
        supabase.table("prospecting_leads")
        .select("id, company_name, city, website, owner_email")
        .is_("owner_email", "null")
        .limit(limit)
        .execute()
    )
    leads = result.data or []
    hunter_key = os.getenv("HUNTER_API_KEY", "")

    async with httpx.AsyncClient(timeout=12) as client:
        tasks = [_enrich_single(lead, client, hunter_key) for lead in leads]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    enriched, skipped = [], []
    for res in results:
        if isinstance(res, Exception):
            continue
        lead_id, ok = res
        (enriched if ok else skipped).append(lead_id)

    return {"enriched": len(enriched), "skipped": len(skipped), "enriched_ids": enriched}
