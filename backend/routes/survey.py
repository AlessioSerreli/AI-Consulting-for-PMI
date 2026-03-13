from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
from supabase import create_client

router = APIRouter()

def get_supabase():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        raise HTTPException(500, "Supabase not configured")
    return create_client(url, key)

class SurveyPayload(BaseModel):
    # Campi obbligatori
    company_name: str
    contact_name: str
    contact_email: str
    sector: str
    employees: str
    # Campi vecchia survey (opzionali per retrocompatibilità)
    founded_year: Optional[str] = None
    main_processes: Optional[List[str]] = None
    manual_processes: Optional[int] = None
    time_waste: Optional[str] = None
    current_tools: Optional[List[str]] = None
    digital_satisfaction: Optional[int] = None
    main_pain: Optional[str] = None
    ai_knowledge: Optional[str] = None
    main_goal: Optional[str] = None
    budget_range: Optional[str] = None
    # Campi nuova survey
    phone: Optional[str] = None
    tools: Optional[List[str]] = None
    critical_process: Optional[str] = None
    time_on_email: Optional[str] = None
    processes_documented: Optional[str] = None
    pain_email: Optional[int] = None
    pain_delegare: Optional[int] = None
    pain_dati: Optional[int] = None
    pain_errori: Optional[int] = None
    pain_tempo: Optional[int] = None
    pain_monitor: Optional[int] = None
    ai_usage: Optional[str] = None
    ai_concerns: Optional[List[str]] = None
    objective: Optional[str] = None
    timeline: Optional[str] = None
    budget: Optional[str] = None
    free_notes: Optional[str] = None

@router.post("/survey")
async def submit_survey(payload: SurveyPayload, background_tasks: BackgroundTasks):
    try:
        supabase = get_supabase()
        data = payload.model_dump()
        result = supabase.table("leads").insert({
            "company_name": data["company_name"],
            "contact_name": data["contact_name"],
            "contact_email": data["contact_email"],
            "sector": data["sector"],
            "employees": data["employees"],
            "status": "new",
            "survey_data": data,
        }).execute()

        lead_id = result.data[0]["id"]
        background_tasks.add_task(generate_scorecard_async, lead_id, data)
        return {"success": True, "lead_id": lead_id}
    except Exception as e:
        raise HTTPException(500, str(e))

async def generate_scorecard_async(lead_id: str, survey_data: dict):
    try:
        from ai.scoring import generate_scorecard
        from pdf.generator import generate_pdf
        import resend
        scorecard = await generate_scorecard(survey_data)
        pdf_bytes = generate_pdf(scorecard, survey_data)

        supabase = get_supabase()
        supabase.table("leads").update({
            "overall_score": scorecard["overall_score"],
            "scorecard_data": scorecard,
            "status": "survey_done",
        }).eq("id", lead_id).execute()

        resend.api_key = os.getenv("RESEND_API_KEY")
        if resend.api_key:
            import base64
            params = {
                "from": os.getenv("FROM_EMAIL", "onboarding@resend.dev"),
                "to": [survey_data["contact_email"]],
                "subject": f"La tua AI Efficiency Scorecard — {survey_data['company_name']}",
                "html": build_email_html(scorecard, survey_data),
            }
            if pdf_bytes:
                params["attachments"] = [{"filename": "scorecard.pdf", "content": base64.b64encode(pdf_bytes).decode()}]
            try:
                result = resend.Emails.send(params)
                print(f"Email inviata: {result}")
            except Exception as email_error:
                print(f"Errore invio email: {email_error}")
        else:
            print("RESEND_API_KEY non configurata")
    except Exception as e:
        print(f"Error generating scorecard: {e}")

@router.post("/survey/resend-email/{lead_id}")
async def resend_email(lead_id: str):
    try:
        import resend, base64
        supabase = get_supabase()
        result = supabase.table("leads").select("*").eq("id", lead_id).execute()
        if not result.data:
            raise HTTPException(404, "Lead non trovato")
        lead = result.data[0]
        scorecard = lead.get("scorecard_data")
        survey_data = lead.get("survey_data")
        if not scorecard or not survey_data:
            raise HTTPException(400, "Scorecard non ancora generata per questo lead")
        resend.api_key = os.getenv("RESEND_API_KEY")
        params = {
            "from": os.getenv("FROM_EMAIL", "onboarding@resend.dev"),
            "to": [lead["contact_email"]],
            "subject": f"La tua AI Efficiency Scorecard — {lead['company_name']}",
            "html": build_email_html(scorecard, survey_data),
        }
        result_email = resend.Emails.send(params)
        print(f"Email inviata: {result_email}")
        return {"success": True, "message": f"Email inviata a {lead['contact_email']}"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Errore resend-email: {e}")
        raise HTTPException(500, str(e))

@router.post("/survey/retry/{lead_id}")
async def retry_scorecard(lead_id: str, background_tasks: BackgroundTasks):
    try:
        supabase = get_supabase()
        result = supabase.table("leads").select("*").eq("id", lead_id).execute()
        if not result.data:
            raise HTTPException(404, "Lead non trovato")
        lead = result.data[0]
        if lead.get("status") == "survey_done":
            return {"success": False, "message": "Scorecard già inviata per questo lead"}
        survey_data = lead.get("survey_data", {})
        if not survey_data:
            raise HTTPException(400, "survey_data mancante per questo lead")
        background_tasks.add_task(generate_scorecard_async, lead_id, survey_data)
        return {"success": True, "message": f"Scorecard in generazione per lead {lead_id}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/survey/retry-pending")
async def retry_pending_scorecards(background_tasks: BackgroundTasks):
    try:
        supabase = get_supabase()
        result = supabase.table("leads").select("*").eq("status", "new").execute()
        leads = result.data or []
        queued = []
        for lead in leads:
            survey_data = lead.get("survey_data", {})
            if survey_data:
                background_tasks.add_task(generate_scorecard_async, lead["id"], survey_data)
                queued.append(lead["id"])
        return {"success": True, "queued": len(queued), "lead_ids": queued}
    except Exception as e:
        raise HTTPException(500, str(e))

def build_email_html(scorecard: dict, survey_data: dict) -> str:
    return f"""
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; background: #0A1628; color: #F8FAFC; padding: 40px; border-radius: 16px;">
        <h1 style="color: #3B82F6; margin-bottom: 8px;">La tua Efficiency Scorecard</h1>
        <p style="color: #94A3B8; margin-bottom: 32px;">Ciao {survey_data['contact_name']}, ecco l'analisi AI di <strong style="color: white;">{survey_data['company_name']}</strong></p>
        <div style="background: #0F1E35; border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: #2563EB;">{scorecard.get('overall_score', 0)}/100</div>
            <div style="color: #94A3B8; margin-top: 8px;">Punteggio Complessivo</div>
        </div>
        <h2 style="color: white; margin-bottom: 16px;">I tuoi 3 Quick Win prioritari:</h2>
        {"".join(f'<div style="background: #0F1E35; border-radius: 8px; padding: 16px; margin-bottom: 12px; border-left: 3px solid #2563EB;"><strong style="color: white;">{i+1}. {win}</strong></div>' for i, win in enumerate(scorecard.get('quick_wins', [])))}
        <p style="color: #94A3B8; margin-top: 24px;">Trovi la scorecard completa in allegato. <a href="https://calendly.com/ai-consulting-pmi" style="color: #3B82F6;">Prenota la tua call gratuita →</a></p>
    </div>
    """
