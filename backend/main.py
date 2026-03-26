from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from dotenv import load_dotenv
import os

load_dotenv()

from limiter import limiter
from routes.survey import router as survey_router
from routes.scorecard import router as scorecard_router
from routes.crm import router as crm_router
from routes.prospecting import router as prospecting_router

app = FastAPI(title="AI Consulting PMI API", version="0.1.0")

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — origini esplicite, nessun wildcard
_allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003",
    "http://localhost:3004",
    "http://localhost:3005",
]
_frontend_url = os.getenv("FRONTEND_URL")
if _frontend_url:
    _allowed_origins.append(_frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(survey_router)
app.include_router(scorecard_router)
app.include_router(crm_router)
app.include_router(prospecting_router)

@app.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
