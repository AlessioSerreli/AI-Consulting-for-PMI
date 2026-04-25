from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
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


def _sb_headers() -> dict:
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }


def _sb_url(table: str) -> str:
    base = os.getenv("SUPABASE_URL", "").rstrip("/")
    return f"{base}/rest/v1/{table}"


async def sb_select(table: str, filters: dict | None = None, order: str | None = None, limit: int | None = None) -> list:
    """Async SELECT via httpx — bypasses sync DNS issue."""
    params: dict = {}
    if order:
        params["order"] = order
    if limit:
        params["limit"] = str(limit)
    if filters:
        params.update(filters)
    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.get(_sb_url(table), headers=_sb_headers(), params=params)
        r.raise_for_status()
        return r.json()


async def sb_insert(table: str, data: list | dict) -> list:
    """Async INSERT via httpx."""
    payload = data if isinstance(data, list) else [data]
    async with httpx.AsyncClient() as client:
        r = await client.post(_sb_url(table), headers=_sb_headers(), json=payload)
        r.raise_for_status()
        return r.json()


async def sb_update(table: str, data: dict, eq_col: str, eq_val: str) -> list:
    """Async UPDATE via httpx."""
    params = {eq_col: f"eq.{eq_val}"}
    async with httpx.AsyncClient() as client:
        r = await client.patch(_sb_url(table), headers=_sb_headers(), params=params, json=data)
        r.raise_for_status()
        return r.json()


async def sb_upsert(table: str, data: dict) -> list:
    """Async UPSERT via httpx."""
    headers = {**_sb_headers(), "Prefer": "resolution=merge-duplicates,return=representation"}
    async with httpx.AsyncClient() as client:
        r = await client.post(_sb_url(table), headers=headers, json=data)
        r.raise_for_status()
        return r.json()


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
    status: Optional[str] = None
    notes: Optional[str] = None
    contact_channel: Optional[str] = None
    instagram_handle: Optional[str] = None
    demo_url: Optional[str] = None


class OutreachTemplate(BaseModel):
    subject: str
    body: str


class BulkOutreachRequest(BaseModel):
    lead_ids: List[str]
    subject_tmpl: Optional[str] = None
    body_tmpl: Optional[str] = None


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


DEFAULT_SUBJECT = "Ho visto {{company_name}} su Google Maps"
DEFAULT_BODY = (
    "Ciao {{owner_name}},\n\n"
    "Ho notato che {{company_name}} non ha ancora un sito web.\n\n"
    "Lavoro con piccole imprese per portarle online con strumenti AI, velocemente e senza costi fissi.\n\n"
    "Se sei curioso/a, ci mettono 15 minuti — prenota una call gratuita qui:\n"
    "{{calendly_url}}\n\n"
    "Nessun impegno.\n\n"
    "A presto,\nLuigi & Alessio\nRESTART"
)


@router.get("/runs/{run_id}/results")
async def get_run_results(run_id: str, save: bool = Query(True), no_website_only: bool = Query(False)):
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
        if not lead["company_name"]:
            continue
        if no_website_only and lead.get("website"):
            continue
        leads.append(lead)

    # Salva su Supabase (async httpx — bypasses sync DNS issue)
    if save and leads:
        try:
            await sb_insert("prospecting_leads", leads)
        except Exception as e:
            print(f"[prospecting] Supabase insert failed (results still returned): {e}")

    return {"status": "SUCCEEDED", "count": len(leads), "results": leads}


@router.get("/leads")
async def get_prospecting_leads(
    status: Optional[str] = Query(None),
    limit: int = Query(50),
):
    filters: dict = {"select": "*", "order": "created_at.desc"}
    if status:
        filters["status"] = f"eq.{status}"
    data = await sb_select("prospecting_leads", filters=filters, limit=limit)
    return data


@router.post("/leads")
async def create_manual_lead(lead: ManualLeadCreate):
    data = lead.model_dump(exclude_none=True)
    data["status"] = "new"
    data["source"] = "manual"
    result = await sb_insert("prospecting_leads", data)
    return result[0] if result else {}


@router.patch("/leads/{lead_id}")
async def update_prospecting_lead(lead_id: str, update: LeadStatusUpdate):
    data: dict = {}
    if update.status is not None:
        data["status"] = update.status
    if update.notes is not None:
        data["notes"] = update.notes
    if update.contact_channel is not None:
        data["contact_channel"] = update.contact_channel
    if update.instagram_handle is not None:
        data["instagram_handle"] = update.instagram_handle
    if update.demo_url is not None:
        data["demo_url"] = update.demo_url
    if not data:
        return {}
    result = await sb_update("prospecting_leads", data, "id", lead_id)

    # Se lo stato diventa "contacted", inserisce nella Pipeline CRM se non già presente
    if update.status == "contacted":
        try:
            rows = await sb_select("prospecting_leads", filters={"select": "*", "id": f"eq.{lead_id}"})
            if rows:
                lead = rows[0]
                owner_email = lead.get("owner_email") or lead.get("email", "")
                if owner_email:
                    existing = await sb_select("leads", filters={"select": "id", "contact_email": f"eq.{owner_email}"})
                    if not existing:
                        await sb_insert("leads", {
                            "company_name":  lead.get("company_name", ""),
                            "contact_name":  lead.get("owner_name", ""),
                            "contact_email": owner_email,
                            "sector":        lead.get("category") or "",
                            "status":        "new",
                        })
        except Exception:
            pass

    return result[0] if result else {}


@router.delete("/leads/{lead_id}")
async def delete_prospecting_lead(lead_id: str):
    async with httpx.AsyncClient() as client:
        r = await client.delete(
            _sb_url("prospecting_leads"),
            headers=_sb_headers(),
            params={"id": f"eq.{lead_id}"},
        )
        r.raise_for_status()
    return {"deleted": True}


class BulkDeleteRequest(BaseModel):
    lead_ids: List[str]


@router.post("/leads/bulk-delete")
async def bulk_delete_leads(request: BulkDeleteRequest):
    if not request.lead_ids:
        return {"deleted": 0}
    ids_filter = "in.(" + ",".join(request.lead_ids) + ")"
    async with httpx.AsyncClient() as client:
        r = await client.delete(
            _sb_url("prospecting_leads"),
            headers=_sb_headers(),
            params={"id": ids_filter},
        )
        r.raise_for_status()
    return {"deleted": len(request.lead_ids)}


@router.get("/template")
async def get_outreach_template():
    try:
        rows = await sb_select("settings", filters={"select": "key,value", "key": "in.(outreach_template_subject,outreach_template_body)"})
        settings = {row["key"]: row["value"] for row in (rows or [])}
        return {
            "subject": settings.get("outreach_template_subject", DEFAULT_SUBJECT),
            "body":    settings.get("outreach_template_body",    DEFAULT_BODY),
        }
    except Exception:
        return {"subject": DEFAULT_SUBJECT, "body": DEFAULT_BODY}


@router.put("/template")
async def update_outreach_template(template: OutreachTemplate):
    now = datetime.utcnow().isoformat()
    for key, value in [
        ("outreach_template_subject", template.subject),
        ("outreach_template_body",    template.body),
    ]:
        await sb_upsert("settings", {"key": key, "value": value, "updated_at": now})
    return {"saved": True}


class SendEmailRequest(BaseModel):
    subject_tmpl: Optional[str] = None
    body_tmpl: Optional[str] = None


@router.post("/leads/{lead_id}/send-email")
async def send_email_from_template(lead_id: str, req: SendEmailRequest = SendEmailRequest()):
    """Invia email usando il template (passato nel body o default)."""
    resend_key = os.getenv("RESEND_API_KEY")
    if not resend_key:
        raise HTTPException(500, "RESEND_API_KEY non configurata")

    lead_rows = await sb_select("prospecting_leads", filters={"select": "*", "id": f"eq.{lead_id}"})
    if not lead_rows:
        raise HTTPException(404, "Lead non trovato")
    lead = lead_rows[0]

    owner_name   = lead.get("owner_name") or lead.get("company_name", "")
    owner_email  = lead.get("owner_email") or lead.get("email", "")
    company_name = lead.get("company_name", "")
    first_name   = owner_name.split()[0] if owner_name else "Titolare"

    if not owner_email:
        raise HTTPException(400, "Nessuna email disponibile per questo lead")

    subject_tmpl = req.subject_tmpl or DEFAULT_SUBJECT
    body_tmpl    = req.body_tmpl    or DEFAULT_BODY

    calendly_url = "https://calendly.com/aiconsultingpmi/30min"

    def replace_vars(text: str) -> str:
        return (text
                .replace("{{company_name}}", company_name)
                .replace("{{owner_name}}",   first_name)
                .replace("{{calendly_url}}", calendly_url))

    subject   = replace_vars(subject_tmpl)
    body_text = replace_vars(body_tmpl)
    html_body = (
        "<!DOCTYPE html><html><body style=\"font-family:Georgia,serif;"
        "max-width:600px;margin:40px auto;color:#333;line-height:1.8;font-size:16px;\">"
        f"<div style=\"white-space:pre-line;\">{body_text}</div>"
        "</body></html>"
    )

    from_email = os.getenv("FROM_EMAIL", "onboarding@resend.dev")
    to_email = owner_email
    if from_email == "onboarding@resend.dev":
        to_email = os.getenv("ADMIN_EMAIL", "aseeerreli@gmail.com")

    import resend as _resend
    _resend.api_key = resend_key
    _resend.Emails.send({
        "from":    from_email,
        "to":      [to_email],
        "subject": subject,
        "html":    html_body,
    })

    await sb_update("prospecting_leads", {
        "status":           "contacted",
        "outreach_sent_at": datetime.utcnow().isoformat(),
    }, "id", lead_id)

    return {"sent": True, "sent_to": owner_email, "subject": subject}


async def _send_outreach_impl(lead_id: str, subject_tmpl: Optional[str] = None, body_tmpl: Optional[str] = None) -> dict:
    """Logica core: invia email outreach + aggiorna DB. Raises Exception on failure."""
    resend_key = os.getenv("RESEND_API_KEY")
    if not resend_key:
        raise ValueError("RESEND_API_KEY non configurata")

    rows = await sb_select("prospecting_leads", filters={"select": "*", "id": f"eq.{lead_id}"})
    if not rows:
        raise ValueError(f"Lead {lead_id} non trovato")

    lead = rows[0]
    owner_name   = lead.get("owner_name") or lead.get("company_name", "")
    owner_email  = lead.get("owner_email") or lead.get("email", "")
    company_name = lead.get("company_name", "")
    first_name   = owner_name.split()[0] if owner_name else "Imprenditore"

    if not owner_email:
        raise ValueError("Nessuna email disponibile (esegui prima l'enrich)")

    subject_tmpl = subject_tmpl or DEFAULT_SUBJECT
    body_tmpl    = body_tmpl    or DEFAULT_BODY

    calendly_url = "https://calendly.com/aiconsultingpmi/30min"

    def _rv(text: str) -> str:
        return (text
                .replace("{{company_name}}", company_name)
                .replace("{{owner_name}}",   first_name)
                .replace("{{calendly_url}}", calendly_url))

    subject   = _rv(subject_tmpl)
    body_text = _rv(body_tmpl)
    html_body = (
        "<!DOCTYPE html><html><body style=\"font-family:Georgia,serif;"
        "max-width:600px;margin:40px auto;color:#333;line-height:1.8;font-size:16px;\">"
        f"<div style=\"white-space:pre-line;\">{body_text}</div>"
        "</body></html>"
    )

    from_email = os.getenv("FROM_EMAIL", "onboarding@resend.dev")
    to_email = owner_email
    if from_email == "onboarding@resend.dev":
        to_email = os.getenv("ADMIN_EMAIL", "aseeerreli@gmail.com")

    import resend
    resend.api_key = resend_key
    resend.Emails.send({
        "from": from_email,
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    })

    await sb_update("prospecting_leads", {
        "status": "contacted",
        "outreach_sent_at": datetime.utcnow().isoformat(),
    }, "id", lead_id)

    # Inserisce il lead nella Pipeline CRM (leads) se non esiste già
    already_in_pipeline = False
    try:
        existing = await sb_select("leads", filters={"select": "id", "contact_email": f"eq.{owner_email}"})
        if existing:
            already_in_pipeline = True
        else:
            await sb_insert("leads", {
                "company_name": company_name,
                "contact_name": owner_name,
                "contact_email": owner_email,
                "sector": lead.get("category") or "",
                "status": "new",
            })
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
            await _send_outreach_impl(lead_id, subject_tmpl=request.subject_tmpl, body_tmpl=request.body_tmpl)
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
                    page = await client.get(page_url, headers=headers, follow_redirects=True, timeout=8)
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
            resp = await client.get(url, headers=headers, follow_redirects=True, timeout=8)
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
    rows = await sb_select("prospecting_leads", filters={"select": "*", "id": f"eq.{lead_id}"})
    if not rows:
        raise HTTPException(404, "Lead non trovato")

    lead = rows[0]
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
        await sb_update("prospecting_leads", contact, "id", lead_id)
        saved = True
    except Exception:
        saved = False

    return {"enriched": True, "saved": saved, "source": source, "domain": domain, "contact": contact}


@router.post("/leads/enrich-all")
async def enrich_all_leads(limit: int = Query(10)):
    """
    Arricchisce i primi N lead non ancora enriched.
    Usa scraping sito + Hunter.io in cascata per massimizzare il tasso di successo.
    """
    leads = await sb_select(
        "prospecting_leads",
        filters={"select": "id,company_name,city,website,owner_email", "owner_email": "is.null"},
        limit=limit,
    )
    hunter_key = os.getenv("HUNTER_API_KEY")
    enriched, skipped = [], []

    async with httpx.AsyncClient(timeout=15) as client:
        for lead in leads:
            website      = lead.get("website", "")
            company_name = lead.get("company_name", "")
            city         = lead.get("city", "")
            domain       = _extract_domain(website)
            contact      = {}

            # Step 1: scraping sito
            if website:
                try:
                    scraped = await _scrape_website_emails(website, client)
                    if scraped:
                        contact = {"owner_email": scraped[0], "hunter_domain": domain or ""}
                except Exception:
                    pass

            # Step 2: DuckDuckGo search
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
                    )
                    emails = resp.json().get("data", {}).get("emails", [])
                    if emails:
                        best = emails[0]
                        contact = {
                            "owner_name":  f"{best.get('first_name','')} {best.get('last_name','')}".strip(),
                            "owner_email": best.get("value", ""),
                            "hunter_domain": domain,
                        }
                except Exception:
                    pass

            if contact:
                try:
                    await sb_update("prospecting_leads", contact, "id", lead["id"])
                    enriched.append(lead["id"])
                except Exception:
                    skipped.append(lead["id"])
            else:
                skipped.append(lead["id"])

    return {"enriched": len(enriched), "skipped": len(skipped), "enriched_ids": enriched}
