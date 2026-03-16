from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
import os, base64, re, logging
from supabase import create_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/crm")

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise HTTPException(500, "Supabase not configured")
    return create_client(url, key)

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    estimated_value: Optional[float] = None
    project_phase: Optional[str] = None  # audit | implementazione | formazione | manutenzione

@router.get("/leads")
async def get_leads(
    status: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    limit: int = Query(50),
):
    try:
        supabase = get_supabase()
        q = supabase.table("leads").select("*").order("created_at", desc=True).limit(limit)
        if status:
            q = q.eq("status", status)
        if sector:
            q = q.eq("sector", sector)
        result = q.execute()
        leads = []
        for lead in result.data:
            scorecard = lead.get("scorecard_data") or {}
            lead["has_pdf"] = bool(scorecard.get("_pdf_b64"))
            if scorecard.get("_pdf_b64"):
                scorecard_clean = {k: v for k, v in scorecard.items() if k != "_pdf_b64"}
                lead["scorecard_data"] = scorecard_clean
            leads.append(lead)
        return leads
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/leads/{lead_id}")
async def get_lead(lead_id: str):
    try:
        supabase = get_supabase()
        result = supabase.table("leads").select("*").eq("id", lead_id).single().execute()
        return result.data
    except Exception as e:
        raise HTTPException(404, "Lead not found")

@router.get("/leads/{lead_id}/pdf")
async def get_lead_pdf(lead_id: str):
    try:
        supabase = get_supabase()
        result = supabase.table("leads").select("scorecard_data, company_name").eq("id", lead_id).single().execute()
        scorecard = result.data.get("scorecard_data") or {}
        pdf_b64 = scorecard.get("_pdf_b64")
        if not pdf_b64:
            raise HTTPException(404, "PDF non ancora generato per questo lead")
        pdf_bytes = base64.b64decode(pdf_b64)
        raw = result.data.get("company_name", "scorecard")
        company = re.sub(r'[^\w\-]', '_', raw)[:60]
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"inline; filename={company}_scorecard.pdf"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/leads/{lead_id}/generate-pdf")
async def generate_lead_pdf(lead_id: str):
    try:
        supabase = get_supabase()
        result = supabase.table("leads").select("scorecard_data, survey_data, company_name").eq("id", lead_id).single().execute()
        scorecard = result.data.get("scorecard_data")
        survey_data = result.data.get("survey_data")
        if not scorecard or not survey_data:
            raise HTTPException(400, "Scorecard non disponibile per questo lead")
        from pdf.certificate import generate_certificate_pdf
        pdf_bytes = generate_certificate_pdf(scorecard, survey_data)
        if not pdf_bytes:
            raise HTTPException(500, "Generazione PDF fallita")
        scorecard["_pdf_b64"] = base64.b64encode(pdf_bytes).decode()
        supabase.table("leads").update({"scorecard_data": scorecard}).eq("id", lead_id).execute()
        return {"success": True, "message": "PDF generato e salvato"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@router.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, update: LeadUpdate):
    try:
        supabase = get_supabase()
        data = {k: v for k, v in update.model_dump().items() if v is not None}
        result = supabase.table("leads").update(data).eq("id", lead_id).execute()
        return result.data[0]
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/stats")
async def get_stats():
    try:
        supabase = get_supabase()
        all_leads = supabase.table("leads").select("*").execute().data
        from datetime import date
        today = date.today().isoformat()
        surveys_today = sum(1 for l in all_leads if l.get("created_at", "").startswith(today))
        clients = sum(1 for l in all_leads if l.get("status") == "client")
        conversion_rate = round((clients / len(all_leads) * 100) if all_leads else 0, 1)
        return {
            "total_leads": len(all_leads),
            "surveys_today": surveys_today,
            "conversion_rate": conversion_rate,
            "active_clients": clients,
        }
    except Exception as e:
        logger.error("Errore stats: %s", e)
        return {"total_leads": 0, "surveys_today": 0, "conversion_rate": 0, "active_clients": 0}
