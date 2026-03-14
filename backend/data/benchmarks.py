"""
Benchmark settoriali per PMI italiane.
Fonti: Istat ICT 2023, Eurostat DESI 2023, Confindustria Digitale, Assintel Report 2023.
Valori medi su scala 0-100 per le 5 dimensioni di efficienza operativa.
"""
import math
from typing import Tuple

SECTOR_BENCHMARKS = {
    "Manifatturiero / Produzione": {
        "efficienza_operativa": 52,
        "digitalizzazione": 43,
        "gestione_dati": 40,
        "comunicazione_interna": 47,
        "velocita_decisionale": 44,
        "overall": 45,
        "std": 13,
        "sample_label": "PMI manifatturiere italiane",
        "source": "Istat ICT 2023 · Confindustria Digitale",
    },
    "Commercio / Retail": {
        "efficienza_operativa": 50,
        "digitalizzazione": 52,
        "gestione_dati": 44,
        "comunicazione_interna": 52,
        "velocita_decisionale": 47,
        "overall": 49,
        "std": 13,
        "sample_label": "PMI commercio e retail italiane",
        "source": "Eurostat DESI 2023 · Osservatorio eCommerce B2C",
    },
    "Servizi alle imprese": {
        "efficienza_operativa": 56,
        "digitalizzazione": 58,
        "gestione_dati": 52,
        "comunicazione_interna": 60,
        "velocita_decisionale": 55,
        "overall": 56,
        "std": 12,
        "sample_label": "PMI servizi B2B italiane",
        "source": "Eurostat DESI 2023 · Assintel Report",
    },
    "Edilizia / Costruzioni": {
        "efficienza_operativa": 42,
        "digitalizzazione": 35,
        "gestione_dati": 31,
        "comunicazione_interna": 42,
        "velocita_decisionale": 38,
        "overall": 38,
        "std": 12,
        "sample_label": "PMI edilizia e costruzioni italiane",
        "source": "ANCE · Istat ICT 2023",
    },
    "Logistica / Trasporti": {
        "efficienza_operativa": 55,
        "digitalizzazione": 48,
        "gestione_dati": 44,
        "comunicazione_interna": 50,
        "velocita_decisionale": 48,
        "overall": 49,
        "std": 12,
        "sample_label": "PMI logistica e trasporti italiane",
        "source": "Confetra · Eurostat DESI 2023",
    },
    "Alimentare / Ristorazione": {
        "efficienza_operativa": 47,
        "digitalizzazione": 40,
        "gestione_dati": 37,
        "comunicazione_interna": 50,
        "velocita_decisionale": 42,
        "overall": 43,
        "std": 12,
        "sample_label": "PMI alimentari e ristorazione italiane",
        "source": "Federalimentare · Fipe 2023",
    },
    "Salute / Benessere": {
        "efficienza_operativa": 52,
        "digitalizzazione": 50,
        "gestione_dati": 47,
        "comunicazione_interna": 55,
        "velocita_decisionale": 50,
        "overall": 51,
        "std": 12,
        "sample_label": "PMI salute e benessere italiane",
        "source": "Istat ICT 2023 · Confindustria Salute",
    },
    "Tecnologia / IT": {
        "efficienza_operativa": 63,
        "digitalizzazione": 75,
        "gestione_dati": 65,
        "comunicazione_interna": 68,
        "velocita_decisionale": 63,
        "overall": 67,
        "std": 11,
        "sample_label": "PMI tecnologia e IT italiane",
        "source": "Assintel Report 2023 · Eurostat DESI",
    },
    "Studi professionali (Legale, Contabile...)": {
        "efficienza_operativa": 55,
        "digitalizzazione": 55,
        "gestione_dati": 50,
        "comunicazione_interna": 58,
        "velocita_decisionale": 52,
        "overall": 54,
        "std": 12,
        "sample_label": "studi professionali italiani",
        "source": "CNDCEC · Consiglio Nazionale Forense 2023",
    },
    "Turismo / Hospitality": {
        "efficienza_operativa": 48,
        "digitalizzazione": 52,
        "gestione_dati": 42,
        "comunicazione_interna": 52,
        "velocita_decisionale": 45,
        "overall": 48,
        "std": 13,
        "sample_label": "PMI turismo e hospitality italiane",
        "source": "Federturismo · Eurostat DESI 2023",
    },
    "Altro": {
        "efficienza_operativa": 50,
        "digitalizzazione": 47,
        "gestione_dati": 43,
        "comunicazione_interna": 52,
        "velocita_decisionale": 46,
        "overall": 48,
        "std": 13,
        "sample_label": "PMI italiane",
        "source": "Istat ICT 2023 · Eurostat DESI",
    },
}

CERTIFICATION_LEVELS = [
    (81, 100, "ECCELLENZA OPERATIVA",    "#10B981"),
    (66,  80, "EFFICIENZA AVANZATA",     "#F59E0B"),
    (51,  65, "EFFICIENZA INTERMEDIA",   "#F59E0B"),
    (31,  50, "EFFICIENZA IN SVILUPPO",  "#F97316"),
    (0,   30, "EFFICIENZA INIZIALE",     "#EF4444"),
]

DIMENSION_LABELS = {
    "efficienza_operativa":  "Efficienza Operativa",
    "digitalizzazione":      "Digitalizzazione",
    "gestione_dati":         "Gestione Dati",
    "comunicazione_interna": "Comunicazione Interna",
    "velocita_decisionale":  "Velocità Decisionale",
}


def get_benchmark(sector: str) -> dict:
    return SECTOR_BENCHMARKS.get(sector, SECTOR_BENCHMARKS["Altro"])


def score_to_percentile(score: float, mean: float, std: float = 13) -> int:
    z = (score - mean) / std
    percentile = 50 + 50 * math.erf(z / math.sqrt(2))
    return max(1, min(99, round(percentile)))


def get_certification_level(score: int) -> Tuple[str, str]:
    for min_s, max_s, label, color in CERTIFICATION_LEVELS:
        if min_s <= score <= max_s:
            return label, color
    return "EFFICIENZA INIZIALE", "#EF4444"


def get_top_label(percentile: int) -> str:
    top = 100 - percentile
    if top <= 5:  return "Top 5% del settore"
    if top <= 10: return "Top 10% del settore"
    if top <= 25: return "Top 25% del settore"
    if top <= 40: return "Top 40% del settore"
    return f"Percentile {percentile}° del settore"
