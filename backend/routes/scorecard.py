from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ai.scoring import generate_scorecard

router = APIRouter()

class ScorecardRequest(BaseModel):
    lead_id: Optional[str] = None
    survey_data: dict

@router.post("/generate-scorecard")
async def create_scorecard(req: ScorecardRequest):
    try:
        scorecard = await generate_scorecard(req.survey_data)
        return scorecard
    except Exception as e:
        raise HTTPException(500, str(e))
