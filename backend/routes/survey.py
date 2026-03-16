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
    critical_processes: Optional[List[str]] = None
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
    objectives: Optional[List[str]] = None
    free_notes: Optional[str] = None
    prospecting_ref: Optional[str] = None

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

        # Collega il prospecting lead se presente
        if data.get("prospecting_ref"):
            try:
                supabase.table("prospecting_leads").update({
                    "status": "converted",
                    "notes": f"Survey compilata — lead_id: {lead_id}",
                }).eq("id", data["prospecting_ref"]).execute()
            except Exception:
                pass

        background_tasks.add_task(send_confirmation_email, data)
        background_tasks.add_task(generate_scorecard_async, lead_id, data)
        return {"success": True, "lead_id": lead_id}
    except Exception as e:
        raise HTTPException(500, str(e))

async def send_confirmation_email(survey_data: dict):
    try:
        import resend
        resend.api_key = os.getenv("RESEND_API_KEY")
        if not resend.api_key:
            print("RESEND_API_KEY non configurata — email di conferma non inviata")
            return
        params = {
            "from": os.getenv("FROM_EMAIL", "onboarding@resend.dev"),
            "to": [survey_data["contact_email"]],
            "subject": f"Diagnosi ricevuta — {survey_data['company_name']} · AI.PMI",
            "html": build_confirmation_html(survey_data),
        }
        result = resend.Emails.send(params)
        print(f"Email di conferma inviata: {result}")
    except Exception as e:
        print(f"Errore invio email di conferma: {e}")

async def generate_scorecard_async(lead_id: str, survey_data: dict):
    try:
        from ai.scoring import generate_scorecard
        from pdf.certificate import generate_certificate_pdf
        import resend
        scorecard = await generate_scorecard(survey_data)
        pdf_bytes = generate_certificate_pdf(scorecard, survey_data)

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
        from pdf.certificate import generate_certificate_pdf
        import base64
        pdf_bytes = generate_certificate_pdf(scorecard, survey_data)
        params = {
            "from": os.getenv("FROM_EMAIL", "onboarding@resend.dev"),
            "to": [lead["contact_email"]],
            "subject": f"La tua AI Efficiency Scorecard — {lead['company_name']}",
            "html": build_email_html(scorecard, survey_data),
        }
        if pdf_bytes:
            params["attachments"] = [{"filename": "scorecard.pdf", "content": base64.b64encode(pdf_bytes).decode()}]
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

def _qw_label(win) -> str:
    """Estrae il testo da un quick win (dict con title/tool/impact oppure stringa legacy)."""
    if isinstance(win, dict):
        title  = win.get("title", "")
        tool   = win.get("tool", "")
        impact = win.get("impact", "")
        parts = [title]
        if tool:   parts.append(f"<span style='color:#F59E0B;'>⚡ {tool}</span>")
        if impact: parts.append(f"<span style='color:#6B7280;font-size:13px;'>{impact}</span>")
        return "<br>".join(p for p in parts if p)
    return str(win)

def build_email_html(scorecard: dict, survey_data: dict) -> str:
    quick_wins_html = "".join(
        f'<tr><td style="height:8px;"></td></tr>'
        f'<tr><td style="padding:14px 20px;background:#F8FAFC;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;">'
        f'<table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>'
        f'<td width="28" style="vertical-align:top;padding-top:1px;">'
        f'<div style="width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;color:#0A0F1E;">{i+1}</div>'
        f'</td>'
        f'<td style="font-family:Georgia,serif;font-size:15px;color:#374151;line-height:1.6;padding-left:12px;"><strong style="color:#0A0F1E;">{_qw_label(win)}</strong></td>'
        f'</tr></table></td></tr>'
        for i, win in enumerate(scorecard.get('quick_wins', []))
    )
    score = scorecard.get('overall_score', 0)
    score_color = '#10B981' if score >= 70 else '#F59E0B' if score >= 40 else '#EF4444'
    return f"""<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:40px 20px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.10);">
    <tr><td style="background-color:#0A0F1E;padding:48px 48px 40px;text-align:left;">
      <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#F59E0B;">AI · PMI ITALIA</p>
      <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(148,163,184,0.7);">Report Efficienza Operativa</p>
      <h1 style="margin:0;font-family:Georgia,serif;font-size:36px;font-weight:700;line-height:1.15;color:#ffffff;letter-spacing:-0.01em;">
        Il tuo punteggio:<br><span style="color:#F59E0B;">{score}/100</span>
      </h1>
      <div style="width:48px;height:3px;background:#F59E0B;border-radius:2px;margin-top:28px;"></div>
    </td></tr>
    <tr><td style="padding:48px 48px 0;background:#ffffff;">
      <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:16px;color:#374151;line-height:1.7;">
        Ciao <strong style="color:#0A0F1E;">{survey_data.get('contact_name', '')}</strong>,
      </p>
      <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:16px;color:#4B5563;line-height:1.8;">
        L'analisi AI di <strong style="color:#0A0F1E;">{survey_data.get('company_name', '')}</strong> è completa. In allegato trovi il tuo <strong style="color:#0A0F1E;">Certificato di Efficienza Operativa</strong> completo di punteggio, aree critiche e quick win prioritari.
      </p>
      <div style="height:1px;background:#E5E7EB;margin:32px 0;"></div>
      <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#F59E0B;font-weight:700;">I tuoi 3 Quick Win prioritari</p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
        {quick_wins_html}
      </table>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:36px;">
        <tr><td style="padding:16px 20px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;">
          <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#166534;line-height:1.6;">
            ✓ &nbsp;<strong>Il report completo è in allegato in formato PDF.</strong>
          </p>
        </td></tr>
      </table>
      <p style="margin:0 0 36px;font-family:Georgia,serif;font-size:16px;color:#4B5563;line-height:1.8;">
        Vuoi capire come trasformare questi risultati in azioni concrete? Prenota una call gratuita di 30 minuti:
      </p>
    </td></tr>
    <tr><td style="padding:0 48px 48px;background:#ffffff;text-align:left;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="background:#0A0F1E;border-radius:10px;padding:18px 36px;">
          <a href="https://calendly.com/ai-consulting-pmi" style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#F59E0B;text-decoration:none;letter-spacing:0.02em;">
            📞 &nbsp;Prenota la call gratuita →
          </a>
        </td>
      </tr></table>
      <p style="margin:12px 0 0;font-family:Georgia,serif;font-size:12px;color:#9CA3AF;">Oppure rispondi a questa email, ti rispondo entro 24 ore.</p>
    </td></tr>
    <tr><td style="padding:0 48px;"><div style="height:1px;background:#E5E7EB;"></div></td></tr>
    <tr><td style="padding:36px 48px;background:#ffffff;">
      <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:16px;font-weight:700;color:#0A0F1E;">Luigi Negro</p>
      <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:13px;color:#6B7280;letter-spacing:0.05em;text-transform:uppercase;">AI Expert · Ottimizzazione Processi PMI</p>
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding-right:24px;"><a href="tel:+393299576151" style="font-family:Georgia,serif;font-size:14px;color:#4B5563;text-decoration:none;">📞 +39 329 957 6151</a></td>
        <td><a href="mailto:luigi@aiconsultingpmi.it" style="font-family:Georgia,serif;font-size:14px;color:#F59E0B;text-decoration:none;">✉️ luigi@aiconsultingpmi.it</a></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#0A0F1E;padding:20px 48px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:11px;color:rgba(148,163,184,0.5);letter-spacing:0.08em;text-transform:uppercase;">
        Hai ricevuto questa email perché hai completato la diagnosi su AI.PMI &nbsp;·&nbsp; © 2025 AI.PMI Italia
      </p>
    </td></tr>
  </table>
  </td></tr>
</table>
</body></html>"""


def build_confirmation_html(survey_data: dict) -> str:
    contact_name = survey_data.get('contact_name', '')
    company_name = survey_data.get('company_name', '')
    first_name = contact_name.split()[0] if contact_name else 'Imprenditore'
    return f"""<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:40px 20px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.10);">

    <!-- HEADER DARK -->
    <tr><td style="background-color:#0A0F1E;padding:48px 48px 40px;text-align:left;">
      <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#F59E0B;">AI · PMI ITALIA</p>
      <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(148,163,184,0.7);">Diagnosi ricevuta</p>
      <h1 style="margin:0;font-family:Georgia,serif;font-size:36px;font-weight:700;line-height:1.15;color:#ffffff;letter-spacing:-0.01em;">
        Hai appena fatto la cosa<br>più intelligente<br><span style="color:#F59E0B;">della settimana.</span>
      </h1>
      <div style="width:48px;height:3px;background:#F59E0B;border-radius:2px;margin-top:28px;"></div>
    </td></tr>

    <!-- BODY -->
    <tr><td style="padding:48px 48px 0;background:#ffffff;">
      <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:16px;color:#374151;line-height:1.7;">
        Ciao <strong style="color:#0A0F1E;">{first_name}</strong>,
      </p>
      <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:16px;color:#4B5563;line-height:1.8;">
        La tua diagnosi per <strong style="color:#0A0F1E;">{company_name}</strong> è arrivata. Il nostro sistema AI sta già analizzando ogni risposta — processo per processo, inefficienza per inefficienza.
      </p>
      <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:16px;color:#4B5563;line-height:1.8;">
        Entro <strong style="color:#0A0F1E;">5 giorni lavorativi</strong> riceverai un documento che la maggior parte delle aziende non ha mai visto su sé stessa.
      </p>

      <div style="height:1px;background:#E5E7EB;margin:32px 0;"></div>

      <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#F59E0B;font-weight:700;">Cosa stai per ricevere</p>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
        <tr><td style="padding:14px 20px;background:#F8FAFC;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;">
              <div style="width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;color:#0A0F1E;">1</div>
            </td>
            <td style="font-family:Georgia,serif;font-size:15px;color:#374151;line-height:1.6;padding-left:12px;">
              Il tuo <strong style="color:#0A0F1E;">punteggio di efficienza operativa</strong> — dove sei oggi e dove potresti essere
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:14px 20px;background:#F8FAFC;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;">
              <div style="width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;color:#0A0F1E;">2</div>
            </td>
            <td style="font-family:Georgia,serif;font-size:15px;color:#374151;line-height:1.6;padding-left:12px;">
              Le <strong style="color:#0A0F1E;">3 aree critiche</strong> della tua azienda e i quick win attivabili subito
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:14px 20px;background:#FFFBEB;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;">
              <div style="width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;color:#0A0F1E;">★</div>
            </td>
            <td style="font-family:Georgia,serif;font-size:15px;color:#374151;line-height:1.6;padding-left:12px;">
              Il <strong style="color:#0A0F1E;">Certificato di Efficienza Operativa</strong> — valido anche con banche e investitori
            </td>
          </tr></table>
        </td></tr>
      </table>

      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:36px;">
        <tr><td style="padding:16px 20px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;">
          <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#166534;line-height:1.6;">
            ✓ &nbsp;<strong>Non devi fare nulla. Arriva tutto via email, completamente gratuito.</strong>
          </p>
        </td></tr>
      </table>

      <p style="margin:0 0 36px;font-family:Georgia,serif;font-size:16px;color:#4B5563;line-height:1.8;">
        Nel frattempo, se vuoi anticipare i tempi o hai già qualcosa in mente, rispondimi qui.
      </p>
    </td></tr>

    <!-- CTA -->
    <tr><td style="padding:0 48px 48px;background:#ffffff;text-align:left;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="background:#0A0F1E;border-radius:10px;padding:18px 36px;">
          <a href="https://calendly.com/ai-consulting-pmi" style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#F59E0B;text-decoration:none;letter-spacing:0.02em;">
            📞 &nbsp;Prenota una call gratuita →
          </a>
        </td>
      </tr></table>
      <p style="margin:12px 0 0;font-family:Georgia,serif;font-size:12px;color:#9CA3AF;">Oppure rispondi a questa email, ti rispondo entro 24 ore.</p>
    </td></tr>

    <tr><td style="padding:0 48px;"><div style="height:1px;background:#E5E7EB;"></div></td></tr>

    <!-- FOOTER -->
    <tr><td style="padding:36px 48px;background:#ffffff;">
      <p style="margin:0 0 4px;font-family:Georgia,serif;font-size:16px;font-weight:700;color:#0A0F1E;">Luigi Negro</p>
      <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:13px;color:#6B7280;letter-spacing:0.05em;text-transform:uppercase;">AI Expert · Ottimizzazione Processi PMI</p>
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding-right:24px;"><a href="tel:+393299576151" style="font-family:Georgia,serif;font-size:14px;color:#4B5563;text-decoration:none;">📞 +39 329 957 6151</a></td>
        <td><a href="mailto:luigi@aiconsultingpmi.it" style="font-family:Georgia,serif;font-size:14px;color:#F59E0B;text-decoration:none;">✉️ luigi@aiconsultingpmi.it</a></td>
      </tr></table>
    </td></tr>

    <!-- BOTTOM BAR -->
    <tr><td style="background:#0A0F1E;padding:20px 48px;">
      <p style="margin:0;font-family:Georgia,serif;font-size:11px;color:rgba(148,163,184,0.5);letter-spacing:0.08em;text-transform:uppercase;">
        Hai ricevuto questa email perché hai completato la diagnosi su AI.PMI &nbsp;·&nbsp; © 2025 AI.PMI Italia
      </p>
    </td></tr>

  </table>
  </td></tr>
</table>
</body></html>"""
