from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.disease_api import router as disease_router
from backend.api.treatment_api import router as treatment_router
from backend.api.weather_api import router as weather_router
from backend.api.crop_advisor_api import router as crop_advisor_router
from backend.api.market_api import router as market_router
from backend.api.assistant_api import router as assistant_router

app = FastAPI(
    title="AI Powered Farming Assistant API",
    version="1.0.0",
    description="Backend API for AI Powered Farming Assistant",
    debug=True
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
    assistant_router,
    prefix="/api",
)
