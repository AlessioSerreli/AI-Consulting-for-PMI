"""
Generatore del Certificato di Efficienza Operativa — AI.PMI Italia
Design premium 3 pagine A4 con benchmark settoriali.
"""
from datetime import datetime
import hashlib

from data.benchmarks import (
    get_benchmark, score_to_percentile, get_certification_level,
    get_top_label, DIMENSION_LABELS
)


def _cert_number(company: str) -> str:
    now = datetime.now()
    h = hashlib.md5(f"{company}{now.strftime('%Y%m%d')}".encode()).hexdigest()[:8].upper()
    return f"CEF-{now.strftime('%Y%m')}-{h}"


def _score_color(score: int) -> str:
    if score >= 66: return "#10B981"
    if score >= 51: return "#F59E0B"
    if score >= 31: return "#F97316"
    return "#EF4444"


def _bar(label: str, score: int, color: str, is_main: bool = True) -> str:
    pct = min(score, 100)
    if is_main:
        return f"""
        <div style="overflow:hidden;margin-bottom:5px;">
          <span style="font-size:12px;color:#1E293B;font-weight:600;">{label}</span>
          <span style="float:right;font-size:13px;color:#0A0F1E;font-weight:700;">{score}/100</span>
        </div>
        <div style="background:#E2E8F0;border-radius:4px;height:10px;margin-bottom:10px;">
          <div style="background:{color};height:10px;border-radius:4px;width:{pct}%;"></div>
        </div>"""
    else:
        return f"""
        <div style="overflow:hidden;margin-bottom:4px;">
          <span style="font-size:11px;color:#94A3B8;">{label}</span>
          <span style="float:right;font-size:11px;color:#94A3B8;">{score}/100</span>
        </div>
        <div style="background:#E2E8F0;border-radius:4px;height:5px;margin-bottom:20px;">
          <div style="background:#CBD5E1;height:5px;border-radius:4px;width:{pct}%;"></div>
        </div>"""


def _dim_block(dim_key: str, dim_data: dict, benchmark: dict) -> str:
    label = DIMENSION_LABELS.get(dim_key, dim_key)
    score = dim_data.get("score", 0)
    bench = benchmark.get(dim_key, 50)
    color = _score_color(score)
    diff = score - bench
    diff_str = f"+{diff}" if diff > 0 else str(diff)
    diff_color = "#10B981" if diff > 0 else "#EF4444"
    diff_bg = "#F0FDF4" if diff > 0 else "#FEF2F2"
    analysis = dim_data.get("analysis", "")
    improvement = dim_data.get("improvement", "")

    return f"""
    <div style="margin-bottom:22px;padding-bottom:22px;border-bottom:1px solid #E2E8F0;">
      <div style="overflow:hidden;margin-bottom:12px;">
        <span style="font-size:12px;font-weight:700;color:#0A0F1E;text-transform:uppercase;letter-spacing:0.06em;">{label}</span>
        <span style="float:right;font-size:10px;color:{diff_color};font-weight:700;
               background:{diff_bg};padding:2px 8px;border-radius:12px;">{diff_str} vs media settore</span>
      </div>
      {_bar("La tua azienda", score, color, True)}
      {_bar(f"Media settore ({benchmark.get('sample_label', 'PMI italiane')})", bench, "#94A3B8", False)}
      <p style="font-size:12px;color:#374151;line-height:1.7;margin-bottom:6px;">{analysis}</p>
      <p style="font-size:11px;color:#F59E0B;font-weight:600;">▸ {improvement}</p>
    </div>"""


def generate_certificate_html(scorecard: dict, survey_data: dict) -> str:
    now = datetime.now()
    company     = survey_data.get("company_name", "Azienda")
    sector      = survey_data.get("sector", "Altro")
    employees   = survey_data.get("employees", "N/A")
    contact     = survey_data.get("contact_name", "")
    date_str    = now.strftime("%d/%m/%Y")
    cert_number = _cert_number(company)

    benchmark   = get_benchmark(sector)
    overall     = scorecard.get("overall_score", 0)
    cert_level, level_color = get_certification_level(overall)
    percentile  = score_to_percentile(overall, benchmark["overall"], benchmark["std"])
    top_label   = get_top_label(percentile)
    executive   = scorecard.get("executive_summary", "")
    dimensions  = scorecard.get("dimensions", {})
    quick_wins  = scorecard.get("quick_wins", [])

    # --- Personalization data ---
    critical_processes = survey_data.get("critical_processes") or []
    objectives         = survey_data.get("objectives") or []
    pain_map = {
        "Email e riunioni":      survey_data.get("pain_email", 0),
        "Difficoltà a delegare": survey_data.get("pain_delegare", 0),
        "Decisioni senza dati":  survey_data.get("pain_dati", 0),
        "Errori per procedure":  survey_data.get("pain_errori", 0),
        "Attività manuali":      survey_data.get("pain_tempo", 0),
        "Monitorare performance":survey_data.get("pain_monitor", 0),
    }
    top_pains = sorted([(k, v) for k, v in pain_map.items() if v], key=lambda x: -x[1])[:3]

    # --- Build sections ---
    dim_rows = ""
    for dk in DIMENSION_LABELS:
        if dk in dimensions:
            dim_rows += _dim_block(dk, dimensions[dk], benchmark)

    qw_cards = ""
    for i, win in enumerate(quick_wins[:3], 1):
        qw_cards += f"""
        <div style="display:flex;gap:20px;margin-bottom:20px;padding:20px 22px;
                    background:#F8FAFC;border-left:4px solid #F59E0B;border-radius:0 10px 10px 0;">
          <div style="font-size:30px;font-weight:900;color:#F59E0B;min-width:36px;
                      line-height:1;font-family:Arial Black,Arial,sans-serif;">0{i}</div>
          <div style="font-size:13px;color:#1E293B;line-height:1.7;">{win}</div>
        </div>"""

    # Personalization badges
    procs_html = "".join(
        f'<span style="display:inline-block;background:#F59E0B;color:#0A0F1E;border-radius:4px;'
        f'padding:3px 10px;font-size:10px;font-weight:700;margin:3px 4px 3px 0;">{i}° {p}</span>'
        for i, p in enumerate(critical_processes[:3], 1)
    ) or '<span style="font-size:12px;color:#64748B;">N/A</span>'

    obj_html = " · ".join(f'<strong style="color:#CBD5E1;">{o}</strong>' for o in objectives) \
               if objectives else '<span style="color:#64748B;">N/A</span>'

    pain_rows = "".join(
        f'<div style="display:flex;justify-content:space-between;align-items:center;'
        f'padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06);">'
        f'<span style="font-size:11px;color:#94A3B8;">{lbl}</span>'
        f'<span style="color:#F59E0B;letter-spacing:3px;font-size:10px;">{"●" * v + "○" * (5 - v)}</span>'
        f'</div>'
        for lbl, v in top_pains
    )

    # Positioning bar
    bench_left = benchmark["overall"]

    return f"""<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<style>
  @page {{ size: A4; margin: 0; }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: Arial, Helvetica, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    color-adjust: exact;
  }}
  .page {{
    width: 210mm;
    min-height: 297mm;
    page-break-after: always;
    overflow: hidden;
    position: relative;
  }}
  .page:last-child {{ page-break-after: auto; }}
</style>
</head>
<body>

<!-- ══════════════════════════════════════════════════════════════ -->
<!-- PAGINA 1 — COPERTINA                                          -->
<!-- ══════════════════════════════════════════════════════════════ -->
<div class="page" style="background:#0A0F1E;color:#F8FAFC;padding:52px 56px;
     display:flex;flex-direction:column;min-height:297mm;">

  <!-- TOP BAR -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:44px;">
    <span style="font-size:13px;letter-spacing:0.28em;color:#F59E0B;font-weight:700;">AI · PMI ITALIA</span>
    <div style="text-align:right;">
      <div style="font-size:9px;color:#475569;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:3px;">N° Certificato</div>
      <div style="font-size:10px;color:#94A3B8;font-family:Courier New,monospace;font-weight:600;">{cert_number}</div>
    </div>
  </div>

  <!-- TITLE -->
  <div style="border-top:1px solid rgba(245,158,11,0.3);padding-top:32px;margin-bottom:32px;">
    <div style="font-size:9px;letter-spacing:0.22em;color:#475569;text-transform:uppercase;margin-bottom:14px;">
      Documento di analisi riservato
    </div>
    <div style="font-size:40px;font-weight:900;color:#FFFFFF;line-height:1.05;
                text-transform:uppercase;letter-spacing:-0.01em;">
      CERTIFICATO DI<br>EFFICIENZA<br><span style="color:#F59E0B;">OPERATIVA</span>
    </div>
  </div>

  <!-- COMPANY BOX -->
  <div style="border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:22px 26px;
              margin-bottom:32px;background:rgba(255,255,255,0.03);">
    <div style="font-size:9px;letter-spacing:0.22em;color:#475569;text-transform:uppercase;margin-bottom:10px;">
      Rilasciato a
    </div>
    <div style="font-size:26px;font-weight:900;color:#FFFFFF;text-transform:uppercase;
                letter-spacing:-0.01em;margin-bottom:7px;">{company}</div>
    <div style="font-size:12px;color:#64748B;">
      {sector}&nbsp;&nbsp;·&nbsp;&nbsp;{employees} dipendenti&nbsp;&nbsp;·&nbsp;&nbsp;Italia
    </div>
  </div>

  <!-- SCORE + LEVEL -->
  <div style="display:flex;gap:22px;align-items:flex-start;margin-bottom:32px;">
    <div style="background:{level_color};border-radius:10px;padding:18px 24px;
                min-width:130px;text-align:center;flex-shrink:0;">
      <div style="font-size:54px;font-weight:900;color:#0A0F1E;line-height:1;">{overall}</div>
      <div style="font-size:13px;color:rgba(10,15,30,0.65);font-weight:600;">/100</div>
    </div>
    <div style="padding-top:6px;">
      <div style="font-size:16px;font-weight:800;color:#FFFFFF;text-transform:uppercase;
                  letter-spacing:0.04em;margin-bottom:10px;">{cert_level}</div>
      <div style="display:inline-block;background:rgba(245,158,11,0.12);
                  border:1px solid rgba(245,158,11,0.35);border-radius:20px;
                  padding:4px 14px;font-size:11px;color:#F59E0B;font-weight:700;
                  margin-bottom:12px;">{top_label}</div>
      <div style="font-size:10px;color:#475569;line-height:1.6;">
        Confronto con {benchmark['sample_label']}<br>
        Fonte: {benchmark['source']}
      </div>
    </div>
  </div>

  <!-- EXECUTIVE SUMMARY QUOTE -->
  <div style="border-left:3px solid #F59E0B;padding-left:18px;margin-bottom:auto;">
    <div style="font-size:13px;color:#CBD5E1;line-height:1.8;font-style:italic;">
      &ldquo;{executive}&rdquo;
    </div>
  </div>

  <!-- SIGNATURE -->
  <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:22px;margin-top:32px;
              display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <div style="font-size:13px;font-weight:700;color:#FFFFFF;margin-bottom:2px;">Luigi Negro</div>
      <div style="font-size:10px;color:#475569;margin-bottom:2px;">AI Expert &amp; Partner · AI.PMI Italia</div>
      <div style="font-size:10px;color:#475569;">{date_str}</div>
    </div>
    <div style="width:58px;height:58px;border:2px solid rgba(245,158,11,0.4);border-radius:50%;
                display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;">
        <div style="font-size:9px;font-weight:900;color:#F59E0B;letter-spacing:0.12em;">AI·PMI</div>
        <div style="font-size:6px;color:#475569;letter-spacing:0.12em;">CERT.</div>
      </div>
    </div>
  </div>
</div>


<!-- ══════════════════════════════════════════════════════════════ -->
<!-- PAGINA 2 — ANALISI DIMENSIONALE                               -->
<!-- ══════════════════════════════════════════════════════════════ -->
<div class="page" style="background:#FFFFFF;min-height:297mm;">

  <!-- PAGE HEADER -->
  <div style="background:#0A0F1E;padding:16px 56px;display:flex;
              justify-content:space-between;align-items:center;">
    <span style="font-size:10px;letter-spacing:0.22em;color:#F59E0B;font-weight:700;">AI · PMI ITALIA</span>
    <span style="font-size:9px;color:#475569;">{company.upper()} &nbsp;·&nbsp; Analisi Dimensionale &nbsp;·&nbsp; {date_str}</span>
    <span style="font-size:9px;color:#475569;">2 / 3</span>
  </div>

  <div style="padding:30px 56px;">

    <!-- Section title -->
    <div style="margin-bottom:26px;">
      <div style="font-size:8px;letter-spacing:0.22em;color:#94A3B8;text-transform:uppercase;margin-bottom:6px;">
        Analisi dettagliata per dimensione
      </div>
      <div style="font-size:20px;font-weight:900;color:#0A0F1E;text-transform:uppercase;letter-spacing:-0.01em;">
        ANALISI <span style="color:#F59E0B;">DIMENSIONALE</span>
      </div>
    </div>

    {dim_rows}

    <!-- POSITIONING BAR -->
    <div style="background:#F8FAFC;border-radius:10px;padding:20px 22px;margin-top:8px;">
      <div style="font-size:9px;font-weight:700;color:#0A0F1E;text-transform:uppercase;
                  letter-spacing:0.12em;margin-bottom:14px;">
        Posizionamento Competitivo Complessivo
      </div>
      <!-- Track -->
      <div style="position:relative;height:16px;background:#E2E8F0;border-radius:8px;margin-bottom:8px;">
        <!-- Your bar -->
        <div style="position:absolute;left:0;top:0;height:100%;width:{overall}%;
                    background:#F59E0B;border-radius:8px;"></div>
        <!-- Sector avg marker -->
        <div style="position:absolute;left:{bench_left}%;top:-4px;height:24px;
                    width:2px;background:#0A0F1E;border-radius:1px;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:8px;
                  color:#94A3B8;margin-bottom:12px;">
        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
      </div>
      <div style="font-size:12px;color:#374151;">
        Punteggio: <strong style="color:#F59E0B;">{overall}/100</strong>
        &nbsp;·&nbsp;
        Media settore: <strong style="color:#0A0F1E;">{benchmark['overall']}/100</strong>
        &nbsp;·&nbsp;
        Posizionamento: <strong style="color:{level_color};">{top_label}</strong>
      </div>
    </div>

  </div>
</div>


<!-- ══════════════════════════════════════════════════════════════ -->
<!-- PAGINA 3 — QUICK WIN + PERSONALIZZAZIONE                      -->
<!-- ══════════════════════════════════════════════════════════════ -->
<div class="page" style="background:#FFFFFF;min-height:297mm;">

  <!-- PAGE HEADER -->
  <div style="background:#0A0F1E;padding:16px 56px;display:flex;
              justify-content:space-between;align-items:center;">
    <span style="font-size:10px;letter-spacing:0.22em;color:#F59E0B;font-weight:700;">AI · PMI ITALIA</span>
    <span style="font-size:9px;color:#475569;">{company.upper()} &nbsp;·&nbsp; Piano d'Azione &nbsp;·&nbsp; {date_str}</span>
    <span style="font-size:9px;color:#475569;">3 / 3</span>
  </div>

  <div style="padding:30px 56px;">

    <!-- Section title -->
    <div style="margin-bottom:24px;">
      <div style="font-size:8px;letter-spacing:0.22em;color:#94A3B8;text-transform:uppercase;margin-bottom:6px;">
        Raccomandazioni prioritarie
      </div>
      <div style="font-size:20px;font-weight:900;color:#0A0F1E;text-transform:uppercase;letter-spacing:-0.01em;">
        3 QUICK WIN <span style="color:#F59E0B;">IMPLEMENTABILI SUBITO</span>
      </div>
    </div>

    {qw_cards}

    <!-- PERSONALIZATION BOX -->
    <div style="background:#0A0F1E;border-radius:10px;padding:24px 26px;margin-top:24px;">
      <div style="font-size:8px;letter-spacing:0.2em;color:#F59E0B;text-transform:uppercase;
                  font-weight:700;margin-bottom:18px;">
        Questa analisi è stata costruita specificamente per {company}
      </div>

      <div style="display:flex;gap:28px;margin-bottom:{'18px' if top_pains else '0'};">
        <div style="flex:1;">
          <div style="font-size:9px;color:#475569;text-transform:uppercase;
                      letter-spacing:0.12em;margin-bottom:10px;">
            Processi critici analizzati
          </div>
          <div>{procs_html}</div>
        </div>
        <div style="flex:1;">
          <div style="font-size:9px;color:#475569;text-transform:uppercase;
                      letter-spacing:0.12em;margin-bottom:10px;">
            Obiettivi dichiarati
          </div>
          <div style="font-size:11px;color:#CBD5E1;line-height:1.7;">{obj_html}</div>
        </div>
      </div>

      {f"""
      <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:16px;">
        <div style="font-size:9px;color:#475569;text-transform:uppercase;
                    letter-spacing:0.12em;margin-bottom:10px;">Pain points principali (scala 1–5)</div>
        {pain_rows}
      </div>""" if top_pains else ""}
    </div>

    <!-- CERTIFICATE FOOTER -->
    <div style="margin-top:24px;padding-top:18px;border-top:1px solid #E2E8F0;
                display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:9px;color:#94A3B8;line-height:1.8;">
        Certificato N° <strong style="color:#0A0F1E;">{cert_number}</strong><br>
        Generato il {date_str} &nbsp;·&nbsp; Benchmarks: {benchmark['source']}<br>
        Documento riservato — rilasciato esclusivamente a {contact} ({company})
      </div>
      <div style="width:48px;height:48px;border:2px solid #E2E8F0;border-radius:50%;
                  display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <div style="text-align:center;">
          <div style="font-size:7px;font-weight:900;color:#F59E0B;letter-spacing:0.12em;">AI·PMI</div>
          <div style="font-size:5px;color:#94A3B8;letter-spacing:0.12em;">CERT.</div>
        </div>
      </div>
    </div>

  </div>
</div>

</body>
</html>"""


def generate_certificate_pdf(scorecard: dict, survey_data: dict):
    html = generate_certificate_html(scorecard, survey_data)
    try:
        from weasyprint import HTML
        return HTML(string=html).write_pdf()
    except ImportError:
        return html.encode("utf-8")
