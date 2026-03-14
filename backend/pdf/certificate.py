"""
Certificato di Efficienza Operativa — AI.PMI Italia
4 pagine A4: Cover · Executive Dashboard · Analisi Dimensionale · Quick Win AI
"""
from datetime import datetime
import hashlib
import re

from data.benchmarks import (
    get_benchmark, score_to_percentile, get_certification_level,
    get_top_label, DIMENSION_LABELS
)

EMP_MAP = {"1-5": 3, "6-15": 10, "16-50": 25, "51-100": 70, "100+": 120}


def _cert_number(company: str) -> str:
    now = datetime.now()
    h = hashlib.md5(f"{company}{now.strftime('%Y%m%d')}".encode()).hexdigest()[:8].upper()
    return f"CEF-{now.strftime('%Y%m')}-{h}"


def _score_color(score: int) -> str:
    if score >= 66: return "#10B981"
    if score >= 51: return "#F59E0B"
    if score >= 31: return "#F97316"
    return "#EF4444"


def _calc_inefficiency(survey_data: dict) -> dict:
    emp_str   = survey_data.get("employees", "6-15")
    n_emp     = EMP_MAP.get(emp_str, 10)
    time_str  = str(survey_data.get("time_on_email", "2"))
    match     = re.search(r'[\d.]+', time_str)
    hours     = float(match.group()) if match else 2.0
    hourly    = 25
    days      = 220
    total     = n_emp * hours * days * hourly
    recover   = total * 0.35
    return {
        "n_emp": n_emp, "hours": hours,
        "total_k":   f"€{round(total / 1000)}k",
        "recover_k": f"€{round(recover / 1000)}k",
        "hours_yr":  round(n_emp * hours * days),
    }


def _worst_dim(dimensions: dict) -> tuple:
    if not dimensions:
        return None, None, None
    worst_key = min(dimensions, key=lambda k: dimensions[k].get("score", 100))
    return worst_key, DIMENSION_LABELS.get(worst_key, worst_key), dimensions[worst_key]


def _peer_label(score: int, bench: int, std: int = 13) -> tuple:
    """Returns (label, color, bg) based on percentile position."""
    percentile = score_to_percentile(score, bench, std)
    top = 100 - percentile
    if top <= 10:  return "Top 10% settore", "#10B981", "#F0FDF4"
    if top <= 25:  return "Top 25% settore", "#10B981", "#F0FDF4"
    if top <= 40:  return "Top 40% settore", "#F59E0B", "#FFFBEB"
    if top <= 60:  return "Nella media",     "#F59E0B", "#FFFBEB"
    bot = 100 - top
    if bot <= 20:  return f"Bottom 20% settore", "#EF4444", "#FEF2F2"
    return f"Bottom 30% settore", "#EF4444", "#FEF2F2"


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


def _metric_tile(label: str, score: int, bench: int, std: int = 13) -> str:
    color = _score_color(score)
    peer_lbl, peer_color, peer_bg = _peer_label(score, bench, std)
    short = (label
             .replace("Efficienza Operativa", "Efficienza Op.")
             .replace("Comunicazione Interna", "Comunicazione")
             .replace("Velocità Decisionale", "Velocità Dec."))
    return f"""
    <div style="flex:1;background:#F8FAFC;border-radius:8px;padding:14px 8px;
                text-align:center;border-top:3px solid {color};min-width:0;">
      <div style="font-size:7px;color:#94A3B8;text-transform:uppercase;letter-spacing:0.08em;
                  margin-bottom:6px;line-height:1.3;">{short}</div>
      <div style="font-size:22px;font-weight:900;color:{color};line-height:1;">{score}</div>
      <div style="font-size:8px;color:#94A3B8;margin-bottom:6px;">/100</div>
      <div style="font-size:7px;color:{peer_color};font-weight:700;background:{peer_bg};
                  border-radius:10px;padding:2px 4px;line-height:1.4;">{peer_lbl}</div>
    </div>"""


def _dim_block(dim_key: str, dim_data: dict, benchmark: dict) -> str:
    label = DIMENSION_LABELS.get(dim_key, dim_key)
    score = dim_data.get("score", 0)
    bench = benchmark.get(dim_key, 50)
    color = _score_color(score)
    diff  = score - bench
    diff_str   = f"+{diff}" if diff > 0 else str(diff)
    diff_color = "#10B981" if diff > 0 else "#EF4444"
    diff_bg    = "#F0FDF4" if diff > 0 else "#FEF2F2"
    peer_lbl, peer_color, peer_bg = _peer_label(score, bench, benchmark.get("std", 13))

    return f"""
    <div style="margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #E2E8F0;">
      <div style="overflow:hidden;margin-bottom:4px;">
        <span style="font-size:11px;font-weight:700;color:#0A0F1E;text-transform:uppercase;letter-spacing:0.06em;">{label}</span>
        <span style="float:right;display:inline-flex;gap:6px;align-items:center;">
          <span style="font-size:9px;color:{diff_color};font-weight:700;
                 background:{diff_bg};padding:2px 7px;border-radius:10px;">{diff_str} vs media</span>
          <span style="font-size:9px;color:{peer_color};font-weight:700;
                 background:{peer_bg};padding:2px 7px;border-radius:10px;">{peer_lbl}</span>
        </span>
      </div>
      {_bar("La tua azienda", score, color, True)}
      {_bar(f"Media settore ({benchmark.get('sample_label', 'PMI italiane')})", bench, "#94A3B8", False)}
      <p style="font-size:11px;color:#374151;line-height:1.7;margin-bottom:5px;">{dim_data.get('analysis', '')}</p>
      <p style="font-size:10px;color:#F59E0B;font-weight:600;">▸ {dim_data.get('improvement', '')}</p>
    </div>"""


def _qw_card(qw: dict | str, index: int) -> str:
    if isinstance(qw, str):
        return f"""
        <div style="display:flex;gap:16px;margin-bottom:16px;padding:16px 18px;
                    background:#F8FAFC;border-left:4px solid #F59E0B;border-radius:0 8px 8px 0;">
          <div style="font-size:26px;font-weight:900;color:#F59E0B;min-width:30px;line-height:1;">0{index}</div>
          <div style="font-size:12px;color:#1E293B;line-height:1.7;">{qw}</div>
        </div>"""

    title      = qw.get("title", "")
    tool       = qw.get("tool", "")
    process    = qw.get("process", "")
    impact     = qw.get("impact", "")
    steps      = qw.get("steps", [])
    difficulty = qw.get("difficulty", "")
    timeline   = qw.get("timeline", "")
    tool_cost  = qw.get("tool_cost", "")
    who        = qw.get("who", "")

    steps_html = "".join(
        f'<div style="display:flex;gap:8px;margin-bottom:5px;">'
        f'<span style="color:#F59E0B;font-weight:700;font-size:10px;min-width:14px;">{i+1}.</span>'
        f'<span style="font-size:11px;color:#374151;line-height:1.6;">{s}</span>'
        f'</div>'
        for i, s in enumerate(steps[:3])
    )
    diff_color = "#10B981" if difficulty == "Facile" else "#F59E0B"
    who_color  = "#10B981" if "autonomia" in who.lower() else "#F59E0B"

    return f"""
    <div style="margin-bottom:16px;padding:18px 20px;background:#F8FAFC;
                border-left:4px solid #F59E0B;border-radius:0 8px 8px 0;">
      <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:10px;">
        <div style="font-size:26px;font-weight:900;color:#F59E0B;min-width:28px;line-height:1;flex-shrink:0;">0{index}</div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:#0A0F1E;margin-bottom:6px;">{title}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span style="background:#0A0F1E;color:#F59E0B;border-radius:4px;padding:2px 8px;font-size:9px;font-weight:700;">⚡ {tool}</span>
            <span style="background:#E2E8F0;color:#475569;border-radius:4px;padding:2px 8px;font-size:9px;">🎯 {process}</span>
            <span style="background:{diff_color}20;color:{diff_color};border-radius:4px;padding:2px 8px;font-size:9px;font-weight:600;">{difficulty} · {timeline}</span>
            <span style="background:{who_color}15;color:{who_color};border-radius:4px;padding:2px 8px;font-size:9px;font-weight:600;">👤 {who}</span>
            {f'<span style="background:#F1F5F9;color:#475569;border-radius:4px;padding:2px 8px;font-size:9px;">💰 {tool_cost}</span>' if tool_cost else ''}
          </div>
        </div>
      </div>
      <div style="background:#FFFBEB;border:1px solid rgba(245,158,11,0.3);border-radius:6px;
                  padding:8px 12px;margin-bottom:10px;">
        <span style="font-size:10px;font-weight:700;color:#F59E0B;">📈 Impatto stimato: </span>
        <span style="font-size:10px;color:#1E293B;">{impact}</span>
      </div>
      <div style="font-size:9px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Piano di implementazione</div>
      {steps_html}
    </div>"""


def _roadmap(quick_wins: list) -> str:
    if not quick_wins or not isinstance(quick_wins[0], dict):
        return ""

    order = {**{"30 giorni": 1, "60 giorni": 2, "90 giorni": 3}}
    sorted_qw = sorted(
        [(i + 1, qw) for i, qw in enumerate(quick_wins[:3]) if isinstance(qw, dict)],
        key=lambda x: order.get(x[1].get("timeline", "90 giorni"), 3)
    )

    nodes = ""
    for orig_idx, qw in sorted_qw:
        tl   = qw.get("timeline", "")
        diff = qw.get("difficulty", "")
        title_short = qw.get("title", "")[:30] + ("…" if len(qw.get("title", "")) > 30 else "")
        color = "#10B981" if diff == "Facile" else "#F59E0B"
        nodes += f"""
        <div style="flex:1;text-align:center;position:relative;">
          <div style="width:16px;height:16px;background:{color};border-radius:50%;margin:0 auto 8px;
                      border:3px solid white;box-shadow:0 0 0 2px {color};position:relative;z-index:1;"></div>
          <div style="font-size:10px;font-weight:700;color:#0A0F1E;margin-bottom:2px;">{tl}</div>
          <div style="font-size:9px;color:#64748B;line-height:1.4;">{title_short}</div>
          <div style="font-size:8px;color:{color};font-weight:600;margin-top:3px;">{diff}</div>
        </div>"""

    return f"""
    <div style="background:#F8FAFC;border-radius:8px;padding:18px 20px;margin-top:16px;">
      <div style="font-size:9px;font-weight:700;color:#0A0F1E;text-transform:uppercase;
                  letter-spacing:0.12em;margin-bottom:16px;">Roadmap di implementazione</div>
      <div style="position:relative;">
        <div style="position:absolute;top:7px;left:10%;right:10%;height:2px;background:#E2E8F0;"></div>
        <div style="display:flex;justify-content:space-around;position:relative;">
          {nodes}
        </div>
      </div>
    </div>"""


def generate_certificate_html(scorecard: dict, survey_data: dict) -> str:
    now        = datetime.now()
    company    = survey_data.get("company_name", "Azienda")
    sector     = survey_data.get("sector", "Altro")
    employees  = survey_data.get("employees", "N/A")
    contact    = survey_data.get("contact_name", "")
    date_str   = now.strftime("%d/%m/%Y")
    cert_number = _cert_number(company)

    benchmark  = get_benchmark(sector)
    overall    = scorecard.get("overall_score", 0)
    cert_level, level_color = get_certification_level(overall)
    percentile = score_to_percentile(overall, benchmark["overall"], benchmark["std"])
    top_label  = get_top_label(percentile)
    executive  = scorecard.get("executive_summary", "")
    dimensions = scorecard.get("dimensions", {})
    quick_wins = scorecard.get("quick_wins", [])

    ineff = _calc_inefficiency(survey_data)

    worst_key, worst_label, worst_data = _worst_dim(dimensions)
    worst_score = worst_data.get("score", 0) if worst_data else 0
    worst_improvement = worst_data.get("improvement", "") if worst_data else ""

    critical_processes = survey_data.get("critical_processes") or []
    objectives         = survey_data.get("objectives") or []
    tools_used         = survey_data.get("tools") or []
    time_on_email      = survey_data.get("time_on_email", "N/A")
    proc_doc           = survey_data.get("processes_documented", "N/A")
    ai_usage           = survey_data.get("ai_usage", "N/A")

    pain_map = {
        "Email e riunioni":      survey_data.get("pain_email", 0),
        "Difficoltà a delegare": survey_data.get("pain_delegare", 0),
        "Decisioni senza dati":  survey_data.get("pain_dati", 0),
        "Errori per procedure":  survey_data.get("pain_errori", 0),
        "Attività manuali":      survey_data.get("pain_tempo", 0),
        "Monitorare performance":survey_data.get("pain_monitor", 0),
    }
    sorted_pains = sorted([(k, v) for k, v in pain_map.items() if v], key=lambda x: -x[1])

    metric_tiles = "".join(
        _metric_tile(lbl, dimensions.get(dk, {}).get("score", 0),
                     benchmark.get(dk, 50), benchmark.get("std", 13))
        for dk, lbl in DIMENSION_LABELS.items()
    )

    dim_rows = "".join(
        _dim_block(dk, dimensions[dk], benchmark)
        for dk in DIMENSION_LABELS if dk in dimensions
    )

    qw_cards   = "".join(_qw_card(qw, i + 1) for i, qw in enumerate(quick_wins[:3]))
    roadmap_html = _roadmap(quick_wins)

    pain_rows = "".join(
        f'<div style="display:flex;justify-content:space-between;align-items:center;'
        f'padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">'
        f'<span style="font-size:11px;color:#94A3B8;">{lbl}</span>'
        f'<span style="color:#F59E0B;letter-spacing:3px;font-size:10px;">{"●" * v + "○" * (5 - v)}</span>'
        f'</div>'
        for lbl, v in sorted_pains
    )

    procs_html = "".join(
        f'<span style="display:inline-block;background:#F59E0B;color:#0A0F1E;border-radius:4px;'
        f'padding:3px 9px;font-size:9px;font-weight:700;margin:2px 3px 2px 0;">{i}° {p}</span>'
        for i, p in enumerate(critical_processes[:3], 1)
    ) or '<span style="font-size:11px;color:#64748B;">N/A</span>'

    obj_tags = "".join(
        f'<span style="display:inline-block;background:rgba(245,158,11,0.12);color:#F59E0B;'
        f'border:1px solid rgba(245,158,11,0.3);border-radius:4px;padding:3px 9px;'
        f'font-size:9px;font-weight:600;margin:2px 3px 2px 0;">{o}</span>'
        for o in objectives
    ) or '<span style="font-size:11px;color:#64748B;">N/A</span>'

    bench_left = benchmark["overall"]

    # Worst dimension callout
    worst_callout = ""
    if worst_label and worst_data:
        worst_callout = f"""
        <div style="background:#FEF2F2;border:1.5px solid #FECACA;border-radius:8px;
                    padding:14px 18px;margin-bottom:16px;">
          <div style="overflow:hidden;margin-bottom:6px;">
            <span style="font-size:9px;font-weight:700;color:#EF4444;text-transform:uppercase;
                         letter-spacing:0.1em;">⚠ Punto critico prioritario</span>
            <span style="float:right;font-size:11px;font-weight:900;color:#EF4444;">{worst_score}/100</span>
          </div>
          <div style="font-size:13px;font-weight:700;color:#0A0F1E;margin-bottom:4px;">{worst_label}</div>
          <div style="font-size:11px;color:#374151;line-height:1.6;">
            Questa è la dimensione con il punteggio più basso. {worst_improvement}
          </div>
        </div>"""

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
  .ph {{
    background: #0A0F1E;
    padding: 15px 52px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }}
</style>
</head>
<body>


<!-- ══════════════════════════════════════ PAGE 1: COVER ══ -->
<div class="page" style="background:#0A0F1E;color:#F8FAFC;padding:48px 52px;
     display:flex;flex-direction:column;min-height:297mm;">

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;">
    <span style="font-size:12px;letter-spacing:0.28em;color:#F59E0B;font-weight:700;">AI · PMI ITALIA</span>
    <div style="text-align:right;">
      <div style="font-size:8px;color:#475569;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:2px;">N° Certificato</div>
      <div style="font-size:10px;color:#64748B;font-family:Courier New,monospace;">{cert_number}</div>
    </div>
  </div>

  <div style="border-top:1px solid rgba(245,158,11,0.3);padding-top:26px;margin-bottom:24px;">
    <div style="font-size:8px;letter-spacing:0.22em;color:#475569;text-transform:uppercase;margin-bottom:10px;">
      Documento di analisi riservato
    </div>
    <div style="font-size:36px;font-weight:900;color:#FFFFFF;line-height:1.05;
                text-transform:uppercase;letter-spacing:-0.01em;">
      CERTIFICATO DI<br>EFFICIENZA<br><span style="color:#F59E0B;">OPERATIVA</span>
    </div>
  </div>

  <div style="border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:18px 22px;
              margin-bottom:24px;background:rgba(255,255,255,0.03);">
    <div style="font-size:8px;letter-spacing:0.22em;color:#475569;text-transform:uppercase;margin-bottom:8px;">Rilasciato a</div>
    <div style="font-size:22px;font-weight:900;color:#FFFFFF;text-transform:uppercase;margin-bottom:5px;">{company}</div>
    <div style="font-size:11px;color:#64748B;">{sector} &nbsp;·&nbsp; {employees} dipendenti &nbsp;·&nbsp; Italia</div>
  </div>

  <div style="display:flex;gap:18px;align-items:flex-start;margin-bottom:22px;">
    <div style="background:{level_color};border-radius:10px;padding:14px 20px;min-width:110px;text-align:center;flex-shrink:0;">
      <div style="font-size:44px;font-weight:900;color:#0A0F1E;line-height:1;">{overall}</div>
      <div style="font-size:11px;color:rgba(10,15,30,0.65);font-weight:600;">/100</div>
    </div>
    <div style="padding-top:4px;flex:1;">
      <div style="font-size:14px;font-weight:800;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px;">{cert_level}</div>
      <div style="display:inline-block;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);
                  border-radius:20px;padding:3px 12px;font-size:10px;color:#F59E0B;font-weight:700;margin-bottom:10px;">{top_label}</div>
      <!-- INEFFICIENCY COST BOX -->
      <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:8px 12px;">
        <div style="font-size:9px;color:#FCA5A5;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:3px;">
          Costo stimato dell'inefficienza attuale
        </div>
        <div style="font-size:13px;font-weight:700;color:#FFFFFF;">
          {ineff['total_k']}/anno &nbsp;·&nbsp;
          <span style="color:#F59E0B;">Recuperabile: {ineff['recover_k']}/anno</span>
        </div>
        <div style="font-size:9px;color:#94A3B8;margin-top:2px;">
          Basato su {ineff['n_emp']} dip. × {ineff['hours']}h/giorno × 220 giorni lavorativi
        </div>
      </div>
    </div>
  </div>

  <div style="border-left:3px solid #F59E0B;padding-left:16px;margin-bottom:auto;">
    <div style="font-size:12px;color:#CBD5E1;line-height:1.8;font-style:italic;">&ldquo;{executive}&rdquo;</div>
  </div>

  <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:18px;margin-top:24px;
              display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <div style="font-size:13px;font-weight:700;color:#FFFFFF;margin-bottom:2px;">Luigi Negro</div>
      <div style="font-size:9px;color:#475569;margin-bottom:2px;">AI Expert &amp; Partner · AI.PMI Italia</div>
      <div style="font-size:9px;color:#475569;">{date_str}</div>
    </div>
    <div style="width:50px;height:50px;border:2px solid rgba(245,158,11,0.4);border-radius:50%;
                display:flex;align-items:center;justify-content:center;">
      <div style="text-align:center;">
        <div style="font-size:8px;font-weight:900;color:#F59E0B;letter-spacing:0.12em;">AI·PMI</div>
        <div style="font-size:5px;color:#475569;letter-spacing:0.12em;">CERT.</div>
      </div>
    </div>
  </div>
</div>


<!-- ══════════════════════════════ PAGE 2: EXECUTIVE DASHBOARD ══ -->
<div class="page" style="background:#FFFFFF;min-height:297mm;">
  <div class="ph">
    <span style="font-size:10px;letter-spacing:0.22em;color:#F59E0B;font-weight:700;">AI · PMI ITALIA</span>
    <span style="font-size:9px;color:#475569;">{company.upper()} &nbsp;·&nbsp; Executive Dashboard &nbsp;·&nbsp; {date_str}</span>
    <span style="font-size:9px;color:#475569;">2 / 4</span>
  </div>

  <div style="padding:22px 52px;">

    <div style="margin-bottom:16px;">
      <div style="font-size:8px;letter-spacing:0.22em;color:#94A3B8;text-transform:uppercase;margin-bottom:4px;">Sintesi completa dell'analisi</div>
      <div style="font-size:18px;font-weight:900;color:#0A0F1E;text-transform:uppercase;letter-spacing:-0.01em;">
        EXECUTIVE <span style="color:#F59E0B;">DASHBOARD</span>
      </div>
    </div>

    <!-- 5 METRIC TILES -->
    <div style="display:flex;gap:7px;margin-bottom:16px;">
      {metric_tiles}
    </div>

    <!-- POSITIONING BAR -->
    <div style="background:#F8FAFC;border-radius:8px;padding:14px 18px;margin-bottom:16px;">
      <div style="overflow:hidden;margin-bottom:8px;">
        <span style="font-size:9px;font-weight:700;color:#0A0F1E;text-transform:uppercase;letter-spacing:0.1em;">
          Posizionamento Competitivo Complessivo
        </span>
        <span style="float:right;font-size:10px;color:#0A0F1E;font-weight:700;">{overall}/100</span>
      </div>
      <div style="position:relative;height:12px;background:#E2E8F0;border-radius:6px;margin-bottom:5px;">
        <div style="position:absolute;left:0;top:0;height:100%;width:{overall}%;background:{level_color};border-radius:6px;"></div>
        <div style="position:absolute;left:{bench_left}%;top:-3px;height:18px;width:2px;background:#0A0F1E;border-radius:1px;"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:7px;color:#94A3B8;margin-bottom:6px;">
        <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
      </div>
      <div style="font-size:11px;color:#374151;">
        Punteggio: <strong style="color:{level_color};">{overall}/100</strong> &nbsp;·&nbsp;
        Media settore: <strong style="color:#0A0F1E;">{benchmark['overall']}/100</strong> &nbsp;·&nbsp;
        <strong style="color:{level_color};">{top_label}</strong>
      </div>
    </div>

    <!-- WORST DIMENSION CALLOUT -->
    {worst_callout}

    <!-- TWO COLUMNS -->
    <div style="display:flex;gap:14px;margin-bottom:14px;">
      <div style="flex:1;background:#0A0F1E;border-radius:8px;padding:16px 18px;">
        <div style="font-size:8px;color:#F59E0B;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;margin-bottom:10px;">Contesto aziendale</div>
        <div style="font-size:10px;color:#94A3B8;margin-bottom:5px;"><span style="color:#CBD5E1;font-weight:600;">Settore:</span> {sector}</div>
        <div style="font-size:10px;color:#94A3B8;margin-bottom:5px;"><span style="color:#CBD5E1;font-weight:600;">Dipendenti:</span> {employees}</div>
        <div style="font-size:10px;color:#94A3B8;margin-bottom:5px;"><span style="color:#CBD5E1;font-weight:600;">Email/riunioni:</span> {time_on_email}</div>
        <div style="font-size:10px;color:#94A3B8;margin-bottom:5px;"><span style="color:#CBD5E1;font-weight:600;">Processi doc.:</span> {proc_doc}</div>
        <div style="font-size:10px;color:#94A3B8;"><span style="color:#CBD5E1;font-weight:600;">Uso AI:</span> {ai_usage}</div>
      </div>
      <div style="flex:1;background:#0A0F1E;border-radius:8px;padding:16px 18px;">
        <div style="font-size:8px;color:#F59E0B;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;margin-bottom:10px;">Criticità dichiarate (scala 1–5)</div>
        {pain_rows}
      </div>
    </div>

    <!-- Processi + Obiettivi -->
    <div style="display:flex;gap:14px;">
      <div style="flex:1;padding:14px 16px;background:#F8FAFC;border-radius:8px;">
        <div style="font-size:8px;color:#0A0F1E;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;margin-bottom:8px;">Processi critici analizzati</div>
        {procs_html}
      </div>
      <div style="flex:1;padding:14px 16px;background:#F8FAFC;border-radius:8px;">
        <div style="font-size:8px;color:#0A0F1E;text-transform:uppercase;letter-spacing:0.12em;font-weight:700;margin-bottom:8px;">Obiettivi prioritari</div>
        {obj_tags}
      </div>
    </div>

  </div>
</div>


<!-- ════════════════════════════ PAGE 3: ANALISI DIMENSIONALE ══ -->
<div class="page" style="background:#FFFFFF;min-height:297mm;">
  <div class="ph">
    <span style="font-size:10px;letter-spacing:0.22em;color:#F59E0B;font-weight:700;">AI · PMI ITALIA</span>
    <span style="font-size:9px;color:#475569;">{company.upper()} &nbsp;·&nbsp; Analisi Dimensionale &nbsp;·&nbsp; {date_str}</span>
    <span style="font-size:9px;color:#475569;">3 / 4</span>
  </div>
  <div style="padding:22px 52px;">
    <div style="margin-bottom:16px;">
      <div style="font-size:8px;letter-spacing:0.22em;color:#94A3B8;text-transform:uppercase;margin-bottom:4px;">Analisi dettagliata con confronto peers</div>
      <div style="font-size:18px;font-weight:900;color:#0A0F1E;text-transform:uppercase;letter-spacing:-0.01em;">
        ANALISI <span style="color:#F59E0B;">DIMENSIONALE</span>
      </div>
    </div>
    {dim_rows}
  </div>
</div>


<!-- ══════════════════════════════════ PAGE 4: QUICK WIN ══ -->
<div class="page" style="background:#FFFFFF;min-height:297mm;">
  <div class="ph">
    <span style="font-size:10px;letter-spacing:0.22em;color:#F59E0B;font-weight:700;">AI · PMI ITALIA</span>
    <span style="font-size:9px;color:#475569;">{company.upper()} &nbsp;·&nbsp; Piano d'Azione AI &nbsp;·&nbsp; {date_str}</span>
    <span style="font-size:9px;color:#475569;">4 / 4</span>
  </div>

  <div style="padding:22px 52px;">
    <div style="margin-bottom:16px;">
      <div style="font-size:8px;letter-spacing:0.22em;color:#94A3B8;text-transform:uppercase;margin-bottom:4px;">Azioni prioritarie con strumenti AI specifici</div>
      <div style="font-size:18px;font-weight:900;color:#0A0F1E;text-transform:uppercase;letter-spacing:-0.01em;">
        3 QUICK WIN <span style="color:#F59E0B;">AI-POWERED</span>
      </div>
    </div>

    {qw_cards}

    <!-- ROADMAP -->
    {roadmap_html}

    <!-- CTA FINALE -->
    <div style="margin-top:18px;background:#0A0F1E;border-radius:10px;padding:20px 24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;">
        <div>
          <div style="font-size:9px;color:#F59E0B;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;margin-bottom:6px;">
            Il passo successivo
          </div>
          <div style="font-size:14px;font-weight:700;color:#FFFFFF;margin-bottom:4px;">
            Implementa il Quick Win #1 entro 30 giorni.
          </div>
          <div style="font-size:11px;color:#94A3B8;line-height:1.6;">
            Nei prossimi 5 giorni lavorativi ti contatteremo per una sessione
            strategica gratuita di 45 minuti per definire il piano operativo.
          </div>
        </div>
        <div style="background:#F59E0B;border-radius:8px;padding:12px 20px;text-align:center;flex-shrink:0;">
          <div style="font-size:9px;font-weight:700;color:#0A0F1E;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:2px;">Sessione</div>
          <div style="font-size:13px;font-weight:900;color:#0A0F1E;">GRATUITA</div>
          <div style="font-size:8px;color:#0A0F1E;opacity:0.7;">45 minuti</div>
        </div>
      </div>
    </div>

    <!-- Certificate footer -->
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #E2E8F0;
                display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:9px;color:#94A3B8;line-height:1.8;">
        Certificato N° <strong style="color:#0A0F1E;">{cert_number}</strong> &nbsp;·&nbsp;
        Generato il {date_str} &nbsp;·&nbsp; Benchmarks: {benchmark['source']}<br>
        Documento riservato — rilasciato a {contact} ({company})
      </div>
      <div style="width:40px;height:40px;border:2px solid #E2E8F0;border-radius:50%;
                  display:flex;align-items:center;justify-content:center;flex-shrink:0;">
        <div style="text-align:center;">
          <div style="font-size:7px;font-weight:900;color:#F59E0B;letter-spacing:0.1em;">AI·PMI</div>
          <div style="font-size:5px;color:#94A3B8;letter-spacing:0.1em;">CERT.</div>
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
