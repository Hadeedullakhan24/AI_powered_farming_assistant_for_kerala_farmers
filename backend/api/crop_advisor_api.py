from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Header

from backend.schemas.crop_advisor_schema import CropAdvisorRequest
from backend.services.weather_service import get_weather
from backend.services.season_service import get_season
from backend.services.groq_services import get_crop_advice
from backend.database.mongo import get_crop_history_collection
from backend.api.auth_api import get_current_user_from_token

router = APIRouter()


@router.post("/crop-advisor")
def crop_advisor(request: CropAdvisorRequest, authorization: Optional[str] = Header(None)):
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

        # Persist to MongoDB if authenticated
        if authorization:
            try:
                user = get_current_user_from_token(authorization)
                crop_col = get_crop_history_collection()
                if crop_col is not None:
                    doc = {
                        "user_id": user.get("id"),
                        "email": user.get("email"),
                        "soil_type": request.soil_type,
                        "irrigation": request.irrigation,
                        "best_crop": result.get("best_crop"),
                        "recommended_crops": result.get("recommended_crops"),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    crop_col.insert_one(doc)
            except Exception as auth_err:
                print(f"Notice: Non-blocking auth state in crop advisory ({auth_err})")

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/crop-history")
def get_crop_history(authorization: Optional[str] = Header(None)):
    user = get_current_user_from_token(authorization)
    crop_col = get_crop_history_collection()

    if crop_col is None:
        return {"history": []}

    records = list(crop_col.find({"email": user.get("email")}).sort("timestamp", -1).limit(50))
    for r in records:
        r["id"] = str(r["_id"])
        r.pop("_id", None)

    return {"history": records}