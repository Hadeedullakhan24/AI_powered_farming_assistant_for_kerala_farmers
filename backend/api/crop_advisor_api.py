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

        # Normalize best_crop
        if "best_crop" in result and isinstance(result["best_crop"], dict):
            bc = result["best_crop"]
            bc["name"] = bc.get("name") or bc.get("crop", "Top Recommended Crop")
            bc["confidence"] = int(bc.get("confidence", 90))
            bc["reason"] = bc.get("reason", "Favorable soil and weather conditions.")
            
        # Normalize recommended_crops
        if "recommended_crops" in result and isinstance(result["recommended_crops"], list):
            for i, item in enumerate(result["recommended_crops"]):
                if isinstance(item, dict):
                    item["name"] = item.get("name") or item.get("crop", f"Crop {i+1}")
                    item["rank"] = item.get("rank") or item.get("recommendation_rank", i + 1)
                    item["confidence"] = int(item.get("confidence", 85))
                    item["suitability_score"] = int(item.get("suitability_score", item["confidence"]))
                    
                    # Ensure list types
                    why = item.get("why_recommended", [])
                    item["why_recommended"] = why if isinstance(why, list) else [str(why)]
                    
                    risks = item.get("possible_risks", [])
                    item["possible_risks"] = risks if isinstance(risks, list) else [str(risks)]

                    # Default strings
                    item["best_sowing_time"] = item.get("best_sowing_time", "Optimal Season")
                    item["crop_duration"] = item.get("crop_duration", "Standard")
                    item["water_requirement"] = item.get("water_requirement", "Moderate")
                    item["expected_yield"] = item.get("expected_yield", "High")
                    item["market_demand"] = item.get("market_demand", "High")
                    item["profitability"] = item.get("profitability", "High")

        # Normalize not_recommended
        if "not_recommended" in result and isinstance(result["not_recommended"], list):
            for item in result["not_recommended"]:
                if isinstance(item, dict):
                    item["name"] = item.get("name") or item.get("crop", "Unsuitable Crop")
                    item["reason"] = item.get("reason", "Unfavorable soil or climate conditions.")

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )