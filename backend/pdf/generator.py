import datetime

try:
    from weasyprint import HTML
    _WEASYPRINT_AVAILABLE = True
except ImportError:
    _WEASYPRINT_AVAILABLE = False

def generate_pdf(scorecard: dict, survey_data: dict) -> bytes:
    if not _WEASYPRINT_AVAILABLE:
        return b""
    html_content = build_pdf_html(scorecard, survey_data)
    pdf = HTML(string=html_content).write_pdf()
    return pdf

def build_pdf_html(scorecard: dict, survey_data: dict) -> str:
    dims = scorecard.get("dimensions", {})
    dim_labels = {
        "efficienza_operativa": "Efficienza Operativa",
        "digitalizzazione": "Digitalizzazione",
        "gestione_dati": "Gestione Dati",
        "comunicazione_interna": "Comunicazione Interna",
        "velocita_decisionale": "Velocità Decisionale",
    }

    dims_html = ""
    for key, label in dim_labels.items():
        dim = dims.get(key, {})
        score = dim.get("score", 0)
        color = "#22C55E" if score >= 70 else "#EAB308" if score >= 40 else "#EF4444"
        dims_html += f"""
        <div class="dimension">
            <div class="dim-header">
                <span class="dim-name">{label}</span>
                <span class="dim-score" style="color: {color}">{score}/100</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: {score}%; background: {color}"></div>
            </div>
            <p class="dim-analysis">{dim.get('analysis', '')}</p>
            <p class="dim-improvement"><strong>→ Miglioramento:</strong> {dim.get('improvement', '')}</p>
        </div>
        """

    quick_wins_html = "".join(
        f'<div class="quick-win"><span class="qw-num">{i+1}</span><span>{win}</span></div>'
        for i, win in enumerate(scorecard.get("quick_wins", []))
    )

    today_str = datetime.date.today().strftime('%d/%m/%Y')

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        * {{ box-sizing: border-box; margin: 0; padding: 0; }}
        body {{ font-family: 'Inter', sans-serif; background: #0A1628; color: #F8FAFC; padding: 40px; }}
        .header {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #162440; }}
        .logo {{ display: flex; align-items: center; gap: 8px; }}
        .logo-icon {{ width: 32px; height: 32px; background: #2563EB; border-radius: 8px; }}
        .logo-text {{ font-weight: 700; color: #F8FAFC; font-size: 14px; }}
        .company-info h1 {{ font-size: 24px; font-weight: 800; color: #F8FAFC; }}
        .company-info p {{ color: #94A3B8; font-size: 12px; margin-top: 4px; }}
        .overall-score {{ text-align: center; background: #0F1E35; border-radius: 16px; padding: 32px; margin-bottom: 32px; border: 1px solid #162440; }}
        .overall-score .score-value {{ font-size: 72px; font-weight: 800; color: #2563EB; line-height: 1; }}
        .overall-score .score-label {{ color: #94A3B8; margin-top: 8px; font-size: 14px; }}
        .executive-summary {{ background: #0F1E35; border-radius: 12px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #2563EB; }}
        .executive-summary h2 {{ font-size: 14px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }}
        .executive-summary p {{ color: #CBD5E1; line-height: 1.7; font-size: 14px; }}
        .dimensions h2 {{ font-size: 18px; font-weight: 700; margin-bottom: 16px; }}
        .dimension {{ background: #0F1E35; border-radius: 12px; padding: 20px; margin-bottom: 12px; }}
        .dim-header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }}
        .dim-name {{ font-weight: 600; font-size: 14px; }}
        .dim-score {{ font-weight: 800; font-size: 18px; }}
        .progress-bar {{ height: 6px; background: #162440; border-radius: 3px; margin-bottom: 12px; overflow: hidden; }}
        .progress-fill {{ height: 100%; border-radius: 3px; }}
        .dim-analysis {{ color: #94A3B8; font-size: 13px; line-height: 1.6; margin-bottom: 8px; }}
        .dim-improvement {{ color: #60A5FA; font-size: 12px; line-height: 1.5; }}
        .quick-wins {{ margin-top: 32px; }}
        .quick-wins h2 {{ font-size: 18px; font-weight: 700; margin-bottom: 16px; }}
        .quick-win {{ display: flex; align-items: flex-start; gap: 12px; background: #0F1E35; border-radius: 12px; padding: 16px; margin-bottom: 8px; }}
        .qw-num {{ background: #2563EB; color: white; width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0; }}
        .footer {{ margin-top: 40px; padding-top: 16px; border-top: 1px solid #162440; text-align: center; color: #475569; font-size: 11px; }}
    </style>
    </head>
    <body>
    <div class="header">
        <div class="logo">
            <div class="logo-icon"></div>
            <span class="logo-text">AIConsulting PMI</span>
        </div>
        <div class="company-info">
            <h1>{survey_data.get('company_name', 'La tua Azienda')}</h1>
            <p>{survey_data.get('sector', '')} · {survey_data.get('employees', '')} dipendenti · Generata il {today_str}</p>
        </div>
    </div>

    <div class="overall-score">
        <div class="score-value">{scorecard.get('overall_score', 0)}</div>
        <div class="score-label">Punteggio Complessivo / 100</div>
    </div>

    <div class="executive-summary">
        <h2>Executive Summary</h2>
        <p>{scorecard.get('executive_summary', '')}</p>
    </div>

    <div class="dimensions">
        <h2>Analisi per Dimensione</h2>
        {dims_html}
    </div>

    <div class="quick-wins">
        <h2>I tuoi 3 Quick Win Prioritari</h2>
        {quick_wins_html}
    </div>

    <div class="footer">
        <p>AI Efficiency Scorecard generata da AIConsulting PMI · Riservato e confidenziale · aiconsultingpmi.it</p>
        <p style="margin-top: 4px;">Per discutere i risultati: <a href="https://calendly.com/ai-consulting-pmi" style="color: #2563EB;">Prenota la tua call gratuita →</a></p>
    </div>
    </body>
    </html>
    """
