import anthropic
import json
import os
import re
from ai.prompts import SCORECARD_SYSTEM_PROMPT, SCORECARD_USER_TEMPLATE

async def generate_scorecard(survey_data: dict) -> dict:
    client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    def join_list(val):
        if isinstance(val, list):
            return ", ".join(val)
        return str(val) if val else "N/A"

    user_message = SCORECARD_USER_TEMPLATE.format(
        company_name=survey_data.get("company_name", "N/A"),
        sector=survey_data.get("sector", "N/A"),
        employees=survey_data.get("employees", "N/A"),
        critical_processes=join_list(survey_data.get("critical_processes") or survey_data.get("main_processes")),
        tools=join_list(survey_data.get("tools") or survey_data.get("current_tools")),
        time_on_email=survey_data.get("time_on_email", "N/A"),
        processes_documented=survey_data.get("processes_documented", "N/A"),
        pain_email=survey_data.get("pain_email", "N/A"),
        pain_delegare=survey_data.get("pain_delegare", "N/A"),
        pain_dati=survey_data.get("pain_dati", "N/A"),
        pain_errori=survey_data.get("pain_errori", "N/A"),
        pain_tempo=survey_data.get("pain_tempo", "N/A"),
        pain_monitor=survey_data.get("pain_monitor", "N/A"),
        ai_usage=survey_data.get("ai_usage", "N/A"),
        ai_concerns=join_list(survey_data.get("ai_concerns")),
        objectives=join_list(survey_data.get("objectives") or survey_data.get("main_goal")),
        free_notes=survey_data.get("free_notes", "N/A"),
    )

    message = await client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=SCORECARD_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    content = message.content[0].text
    # Extract JSON from response
    json_match = re.search(r'\{.*\}', content, re.DOTALL)
    if json_match:
        return json.loads(json_match.group())
    return json.loads(content)
