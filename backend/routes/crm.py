from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
import os
from supabase import create_client

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
        return result.data
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
    except Exception:
        return {"total_leads": 0, "surveys_today": 0, "conversion_rate": 0, "active_clients": 0}
