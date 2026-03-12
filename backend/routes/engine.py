from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ai.engine import generate_implementation_plan

router = APIRouter()

class PlanRequest(BaseModel):
    lead_id: str
    survey_data: dict
    scorecard_data: dict

@router.post("/generate-implementation-plan")
async def create_implementation_plan(req: PlanRequest):
    try:
        plan = await generate_implementation_plan(req.survey_data, req.scorecard_data)
        return plan
    except Exception as e:
        raise HTTPException(500, str(e))
