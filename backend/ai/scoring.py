import anthropic
import json
import os
import re
from ai.prompts import SCORECARD_SYSTEM_PROMPT, SCORECARD_USER_TEMPLATE

async def generate_scorecard(survey_data: dict) -> dict:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    user_message = SCORECARD_USER_TEMPLATE.format(
        company_name=survey_data.get("company_name", "N/A"),
        sector=survey_data.get("sector", "N/A"),
        employees=survey_data.get("employees", "N/A"),
        founded_year=survey_data.get("founded_year", "N/A"),
        main_processes=", ".join(survey_data.get("main_processes", [])),
        manual_processes=survey_data.get("manual_processes", "N/A"),
        time_waste=survey_data.get("time_waste", "N/A"),
        current_tools=", ".join(survey_data.get("current_tools", [])),
        digital_satisfaction=survey_data.get("digital_satisfaction", "N/A"),
        main_pain=survey_data.get("main_pain", "N/A"),
        ai_knowledge=survey_data.get("ai_knowledge", "N/A"),
        main_goal=survey_data.get("main_goal", "N/A"),
    )

    message = client.messages.create(
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
