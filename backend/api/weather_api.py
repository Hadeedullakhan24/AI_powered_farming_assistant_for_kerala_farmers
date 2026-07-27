from fastapi import APIRouter, HTTPException

from backend.schemas.weather_schema import WeatherRequest
from backend.services.weather_service import get_weather
from backend.services.groq_services import get_weather_advice

router = APIRouter()


@router.post("/weather")
def weather_advisory(request: WeatherRequest):
    try:
        # Fetch current weather from WeatherAPI
        weather = get_weather(
            request.latitude,
            request.longitude
        )

        # Generate AI weather advisory
        advice = get_weather_advice(
            weather_data=weather,
            crop=request.crop
        )

        return {
            "weather": weather,
            "advice": advice
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )