import anthropic
import json
import os
import re
from ai.prompts import IMPLEMENTATION_SYSTEM_PROMPT
from knowledge.use_cases import get_relevant_use_cases

async def generate_implementation_plan(survey_data: dict, scorecard_data: dict) -> dict:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    sector = survey_data.get("sector", "")
    use_cases = get_relevant_use_cases(sector)

    user_message = f"""Crea un piano di implementazione AI per questa PMI:

PROFILO AZIENDA:
{json.dumps(survey_data, ensure_ascii=False, indent=2)}

SCORECARD AI:
{json.dumps(scorecard_data, ensure_ascii=False, indent=2)}

USE CASE RILEVANTI PER IL SETTORE {sector}:
{json.dumps(use_cases, ensure_ascii=False, indent=2)}

Genera un piano di implementazione dettagliato in JSON con questa struttura:
{{
  "priority_areas": [
    {{
      "area": "<nome area>",
      "problem": "<problema specifico>",
      "solution": "<soluzione AI proposta>",
      "tools": ["<tool1>", "<tool2>"],
      "expected_roi": "<stima ROI realistica>",
      "timeline": "<30/60/90 giorni>"
    }}
  ],
  "roadmap": {{
    "phase_1_30days": ["<azione1>", "<azione2>"],
    "phase_2_60days": ["<azione1>", "<azione2>"],
    "phase_3_90days": ["<azione1>", "<azione2>"]
  }},
  "estimated_monthly_savings": "<stima risparmio mensile>",
  "implementation_notes": "<note importanti>"
}}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        system=IMPLEMENTATION_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    content = message.content[0].text
    json_match = re.search(r'\{.*\}', content, re.DOTALL)
    if json_match:
        return json.loads(json_match.group())
    return json.loads(content)
