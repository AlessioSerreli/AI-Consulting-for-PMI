from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import os
import logging
from supabase import create_client

logger = logging.getLogger(__name__)

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

        background_tasks.add_task(generate_scorecard_async, lead_id, data)
        return {"success": True, "lead_id": lead_id}
    except Exception as e:
        raise HTTPException(500, str(e))

async def send_teaser_email(scorecard: dict, survey_data: dict):
    try:
        import resend
        resend.api_key = os.getenv("RESEND_API_KEY")
        if not resend.api_key:
            logger.warning("RESEND_API_KEY non configurata — teaser email non inviata")
            return
        params = {
            "from": os.getenv("FROM_EMAIL", "onboarding@resend.dev"),
            "to": [survey_data["contact_email"]],
            "subject": f"Il tuo punteggio AI è pronto — {survey_data.get('company_name', '')}",
            "html": build_teaser_email_html(scorecard, survey_data),
        }
        result = resend.Emails.send(params)
        logger.info("Teaser email inviata: %s", result)
    except Exception as e:
        logger.error("Errore invio teaser email: %s", e)

async def generate_scorecard_async(lead_id: str, survey_data: dict):
    try:
        import base64
        from ai.scoring import generate_scorecard
        from pdf.certificate import generate_certificate_pdf
        scorecard = await generate_scorecard(survey_data)
        pdf_bytes = generate_certificate_pdf(scorecard, survey_data)

        if pdf_bytes:
            scorecard["_pdf_b64"] = base64.b64encode(pdf_bytes).decode()

        supabase = get_supabase()
        supabase.table("leads").update({
            "overall_score": scorecard["overall_score"],
            "scorecard_data": scorecard,
            "status": "survey_done",
        }).eq("id", lead_id).execute()

        await send_teaser_email(scorecard, survey_data)
    except Exception as e:
        logger.error("Error generating scorecard for lead %s: %s", lead_id, e)

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
            "subject": f"Il tuo punteggio AI è pronto — {lead['company_name']}",
            "html": build_teaser_email_html(scorecard, survey_data),
        }
        result_email = resend.Emails.send(params)
        logger.info("Email inviata a %s: %s", lead['contact_email'], result_email)
        return {"success": True, "message": f"Email inviata a {lead['contact_email']}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Errore resend-email lead %s: %s", lead_id, e)
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
          <a href="https://calendly.com/aiconsultingpmi/30min" style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#F59E0B;text-decoration:none;letter-spacing:0.02em;">
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


def build_teaser_email_html(scorecard: dict, survey_data: dict) -> str:
    score = scorecard.get('overall_score', 0)
    score_color = '#10B981' if score >= 70 else '#F59E0B' if score >= 40 else '#EF4444'
    if score >= 70:
        level_label = "Efficienza Alta"
    elif score >= 55:
        level_label = "Efficienza Media"
    elif score >= 40:
        level_label = "In Sviluppo"
    else:
        level_label = "Attenzione Richiesta"
    contact_name = survey_data.get('contact_name', '')
    first_name = contact_name.split()[0] if contact_name else 'Imprenditore'
    company_name = survey_data.get('company_name', '')
    executive_summary = scorecard.get('executive_summary', '')
    if executive_summary:
        sentences = [s.strip() for s in executive_summary.replace('!', '.').replace('?', '.').split('.') if s.strip()]
        executive_summary_short = sentences[0] + '.' if sentences else ''
    else:
        executive_summary_short = ''
    return f"""<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:40px 20px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.10);">

    <!-- HEADER DARK -->
    <tr><td style="background-color:#0A0F1E;padding:48px 48px 40px;text-align:left;">
      <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#F59E0B;">AI · PMI ITALIA</p>
      <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(148,163,184,0.7);">La tua Diagnosi AI è pronta</p>
      <h1 style="margin:0;font-family:Georgia,serif;font-size:36px;font-weight:700;line-height:1.15;color:#ffffff;letter-spacing:-0.01em;">
        Il tuo punteggio AI:<br><span style="color:{score_color};">{score}/100</span>
      </h1>
      <p style="margin:16px 0 0;font-family:Georgia,serif;font-size:15px;color:rgba(148,163,184,0.85);letter-spacing:0.05em;text-transform:uppercase;">{level_label}</p>
      <div style="width:48px;height:3px;background:#F59E0B;border-radius:2px;margin-top:24px;"></div>
    </td></tr>

    <!-- BODY -->
    <tr><td style="padding:48px 48px 0;background:#ffffff;">
      <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:16px;color:#374151;line-height:1.7;">
        Ciao <strong style="color:#0A0F1E;">{first_name}</strong>,
      </p>
      <p style="margin:0 0 24px;font-family:Georgia,serif;font-size:16px;color:#4B5563;line-height:1.8;">
        Abbiamo analizzato ogni risposta della tua diagnosi — processo per processo, inefficienza per inefficienza.<br>
        <strong style="color:#0A0F1E;">{company_name}</strong> ottiene un punteggio di <strong style="color:{score_color};">{score}/100</strong>: livello <strong>{level_label}</strong>.
      </p>
      {'''<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;">
        <tr><td style="padding:16px 20px;background:#FFFBEB;border-left:4px solid #F59E0B;border-radius:0 8px 8px 0;">
          <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#78350F;line-height:1.7;font-style:italic;">
            &ldquo;''' + executive_summary_short + '''&rdquo;
          </p>
        </td></tr>
      </table>''' if executive_summary_short else ''}

      <div style="height:1px;background:#E5E7EB;margin:32px 0;"></div>

      <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#F59E0B;font-weight:700;">Cosa scopri nella call gratuita</p>
      <p style="margin:0 0 16px;font-family:Georgia,serif;font-size:16px;color:#4B5563;line-height:1.8;">
        Questo è solo il quadro generale.<br>
        Nella call gratuita di 30 minuti entriamo nel dettaglio e ti mostriamo:
      </p>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:32px;">
        <tr><td style="height:8px;"></td></tr>
        <tr><td style="padding:14px 20px;background:#F8FAFC;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td width="28" style="vertical-align:top;padding-top:1px;">
              <div style="width:20px;height:20px;background:#F59E0B;border-radius:50%;text-align:center;line-height:20px;font-size:11px;font-weight:bold;color:#0A0F1E;">1</div>
            </td>
            <td style="font-family:Georgia,serif;font-size:15px;color:#374151;line-height:1.6;padding-left:12px;">
              L'analisi completa delle <strong style="color:#0A0F1E;">5 dimensioni operative</strong> di {company_name} — dove perdi tempo e denaro
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
              I <strong style="color:#0A0F1E;">3 quick win</strong> prioritari: azioni concrete attivabili entro 30 giorni
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
              Una stima del <strong style="color:#0A0F1E;">ROI potenziale</strong> — quanto recuperi in ore e costi nei prossimi 12 mesi
            </td>
          </tr></table>
        </td></tr>
      </table>

    </td></tr>

    <!-- CTA -->
    <tr><td style="padding:0 48px 48px;background:#ffffff;text-align:left;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="background:#0A0F1E;border-radius:10px;padding:18px 36px;">
          <a href="https://calendly.com/aiconsultingpmi/30min" style="font-family:Georgia,serif;font-size:16px;font-weight:700;color:#F59E0B;text-decoration:none;letter-spacing:0.02em;">
            📞 &nbsp;Prenota la call gratuita di 30 minuti →
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
