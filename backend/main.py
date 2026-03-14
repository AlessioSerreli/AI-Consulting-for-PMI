from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from routes.survey import router as survey_router
from routes.scorecard import router as scorecard_router
from routes.crm import router as crm_router
from routes.prospecting import router as prospecting_router

app = FastAPI(title="AI Consulting PMI API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(survey_router)
app.include_router(scorecard_router)
app.include_router(crm_router)
app.include_router(prospecting_router)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
