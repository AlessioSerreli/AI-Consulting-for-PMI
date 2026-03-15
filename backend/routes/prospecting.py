from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
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


@router.patch("/leads/{lead_id}")
async def update_prospecting_lead(lead_id: str, update: LeadStatusUpdate):
    supabase = get_supabase()
    data = {"status": update.status}
    if update.notes:
        data["notes"] = update.notes
    result = supabase.table("prospecting_leads").update(data).eq("id", lead_id).execute()
    return result.data[0] if result.data else {}


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
    """Arricchisce un lead con email e contatti dal dominio tramite Hunter.io."""
    hunter_key = os.getenv("HUNTER_API_KEY")
    if not hunter_key:
        raise HTTPException(500, "HUNTER_API_KEY non configurata nel .env")

    supabase = get_supabase()
    result = supabase.table("prospecting_leads").select("*").eq("id", lead_id).execute()
    if not result.data:
        raise HTTPException(404, "Lead non trovato")

    lead = result.data[0]
    domain = _extract_domain(lead.get("website", ""))
    if not domain:
        return {"enriched": False, "reason": "Nessun sito web disponibile per questo lead"}

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{HUNTER_BASE}/domain-search",
            params={"domain": domain, "api_key": hunter_key, "limit": 5},
        )

    if resp.status_code != 200:
        raise HTTPException(502, f"Errore Hunter.io: {resp.text}")

    data = resp.json().get("data", {})
    emails = data.get("emails", [])

    if not emails:
        return {"enriched": False, "domain": domain, "reason": "Nessuna email trovata su Hunter.io"}

    # Cerca il decision maker: Owner > CEO > Founder > Director > primo disponibile
    priority = ["owner", "ceo", "founder", "co-founder", "director", "titolare", "amministratore"]
    best = None
    for p in priority:
        for e in emails:
            position = (e.get("position") or "").lower()
            if p in position:
                best = e
                break
        if best:
            break
    if not best:
        best = emails[0]

    contact = {
        "owner_name":     f"{best.get('first_name', '')} {best.get('last_name', '')}".strip(),
        "owner_email":    best.get("value", ""),
        "owner_position": best.get("position", ""),
        "hunter_domain":  domain,
        "hunter_emails":  [{"email": e.get("value"), "name": f"{e.get('first_name','')} {e.get('last_name','')}".strip(), "position": e.get("position","")} for e in emails],
    }

    supabase.table("prospecting_leads").update(contact).eq("id", lead_id).execute()
    return {"enriched": True, "domain": domain, "contact": contact}


@router.post("/leads/enrich-all")
async def enrich_all_leads(limit: int = Query(10)):
    """Arricchisce i primi N lead con sito web non ancora enriched."""
    hunter_key = os.getenv("HUNTER_API_KEY")
    if not hunter_key:
        raise HTTPException(500, "HUNTER_API_KEY non configurata nel .env")

    supabase = get_supabase()
    result = (
        supabase.table("prospecting_leads")
        .select("id, website, owner_email")
        .is_("owner_email", "null")
        .not_.is_("website", "null")
        .neq("website", "")
        .limit(limit)
        .execute()
    )
    leads = result.data or []

    enriched, skipped = [], []
    async with httpx.AsyncClient(timeout=15) as client:
        for lead in leads:
            domain = _extract_domain(lead.get("website", ""))
            if not domain:
                skipped.append(lead["id"])
                continue
            try:
                resp = await client.get(
                    f"{HUNTER_BASE}/domain-search",
                    params={"domain": domain, "api_key": hunter_key, "limit": 3},
                )
                emails = resp.json().get("data", {}).get("emails", [])
                if emails:
                    best = emails[0]
                    supabase.table("prospecting_leads").update({
                        "owner_name":     f"{best.get('first_name','')} {best.get('last_name','')}".strip(),
                        "owner_email":    best.get("value", ""),
                        "owner_position": best.get("position", ""),
                        "hunter_domain":  domain,
                    }).eq("id", lead["id"]).execute()
                    enriched.append(lead["id"])
                else:
                    skipped.append(lead["id"])
            except Exception:
                skipped.append(lead["id"])

    return {"enriched": len(enriched), "skipped": len(skipped), "enriched_ids": enriched}
