import json
import os

def get_relevant_use_cases(sector: str) -> list:
    path = os.path.join(os.path.dirname(__file__), "use_cases.json")
    with open(path) as f:
        all_cases = json.load(f)

    sector_map = {
        "manifattura": ["manifattura", "produzione"],
        "retail": ["commercio", "retail"],
        "servizi": ["servizi"],
        "edilizia": ["edilizia", "costruzioni"],
        "food": ["food", "ristorazione"],
    }

    relevant = []
    for key, keywords in sector_map.items():
        if any(k in sector.lower() for k in keywords):
            relevant.extend([c for c in all_cases if c.get("sector") == key])

    if not relevant:
        relevant = all_cases[:3]

    return relevant[:5]
