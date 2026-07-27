from fastapi import APIRouter, HTTPException

from backend.schemas.crop_advisor_schema import CropAdvisorRequest
from backend.services.weather_service import get_weather
from backend.services.season_service import get_season
from backend.services.groq_services import get_crop_advice

router = APIRouter()


@router.post("/crop-advisor")
def crop_advisor(request: CropAdvisorRequest):
    try:

        weather = get_weather(
            request.latitude,
            request.longitude
        )

        season = get_season()

        result = get_crop_advice(
            weather_data=weather,
            soil_type=request.soil_type,
            irrigation=request.irrigation,
            season=season
        )

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )