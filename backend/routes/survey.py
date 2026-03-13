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
    company_name: str
    sector: str
    employees: str
    founded_year: str
    main_processes: List[str]
    manual_processes: int
    time_waste: str
    current_tools: List[str]
    digital_satisfaction: int
    main_pain: str
    ai_knowledge: str
    main_goal: str
    budget_range: str
    contact_name: str
    contact_email: str

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
            resend.Emails.send(params)
    except Exception as e:
        print(f"Error generating scorecard: {e}")

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
