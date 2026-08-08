from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from backend.api.disease_api import router as disease_router
from backend.api.treatment_api import router as treatment_router
from backend.api.weather_api import router as weather_router
from backend.api.crop_advisor_api import router as crop_advisor_router
from backend.api.market_api import router as market_router
from backend.api.government_api import router as government_router
from backend.api.auth_api import router as auth_router
from backend.api.equipment_api import router as equipment_router
from backend.assistant.routes import router as assistant_router

logger = logging.getLogger("hexakrishi.app")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background jobs and prewarm assistant services on startup."""
    try:
        from backend.jobs.scheme_refresh_job import get_scheduler
        scheduler = get_scheduler()
        scheduler.start()
        logger.info("✅ Scheme refresh scheduler started.")
    except Exception as e:
        logger.warning(f"⚠️ Could not start scheduler (non-fatal): {e}")

    try:
        from backend.assistant.chat.rag import get_rag_retriever
        retriever = get_rag_retriever()
        if retriever and retriever.is_available():
            logger.info("✅ RAG Knowledge Base ready on startup.")
    except Exception as e:
        logger.warning(f"⚠️ Could not prewarm RAG (non-fatal): {e}")

    yield  # ← application runs here

    try:
        from backend.jobs.scheme_refresh_job import get_scheduler
        scheduler = get_scheduler()
        if scheduler.running:
            scheduler.shutdown(wait=False)
            logger.info("🛑 Scheme refresh scheduler stopped.")
    except Exception:
        pass


app = FastAPI(
    title="AI Powered Farming Assistant API",
    version="1.0.0",
    description="Backend API for AI Powered Farming Assistant",
    debug=True,
    lifespan=lifespan,
)


# Allow React frontend to access the API from any port (5173, 5174, 3000, etc)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "AI Powered Farming Assistant API is Running 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }

app.include_router(auth_router)
app.include_router(equipment_router)
app.include_router(disease_router)
app.include_router(treatment_router)
app.include_router(
    weather_router,
    prefix="/api",
    tags=["Weather"]
)
app.include_router(
    crop_advisor_router,
    prefix="/api",
    tags=["Crop Advisor"]
)
app.include_router(market_router)
app.include_router(
    government_router,
    prefix="/api/government",
    tags=["Government Schemes & Financial Advisory"]
)
app.include_router(assistant_router)


