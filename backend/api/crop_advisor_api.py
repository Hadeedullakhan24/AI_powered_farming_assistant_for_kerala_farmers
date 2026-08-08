from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Header

from backend.schemas.crop_advisor_schema import (
    CropAdvisorRequest,
    CropAdvisoryResponse,
    DiseaseIntelligenceRequest,
    DiseaseIntelligenceResponse,
)
from backend.services.weather_service import get_weather
from backend.services.season_service import get_season
from backend.services.groq_services import get_crop_advice
from backend.services.disease_intelligence_service import get_regional_disease_intelligence
from backend.database.mongo import get_crop_history_collection
from backend.api.auth_api import get_current_user_from_token

router = APIRouter()


@router.post("/crop-disease-intelligence", response_model=DiseaseIntelligenceResponse)
def crop_disease_intelligence(request: DiseaseIntelligenceRequest):
    try:
        data = get_regional_disease_intelligence(
            location=request.location,
            crop=request.crop,
        )
        return DiseaseIntelligenceResponse.model_validate(data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Regional Disease Intelligence error: {str(e)}"
        )


@router.post("/crop-advisor", response_model=CropAdvisoryResponse)
def crop_advisor(request: CropAdvisorRequest, authorization: Optional[str] = Header(None)):
    try:
        weather = get_weather(
            request.latitude,
            request.longitude
        )
        weather["latitude"] = request.latitude
        weather["longitude"] = request.longitude

        season = get_season()

        result = get_crop_advice(
            weather_data=weather,
            soil_type=request.soil_type,
            irrigation=request.irrigation,
            season=season
        )

        if not isinstance(result, dict):
            result = {}

        result["location"] = result.get("location") or weather.get("location", "Kerala, India")
        result["summary"] = result.get("summary") or "Comprehensive crop advisory based on local soil and weather conditions."

        # Normalize best_crop
        bc = result.get("best_crop")
        if not isinstance(bc, dict):
            bc = {}
        crop_name = bc.get("crop") or bc.get("name") or "Paddy (Rice)"
        bc["crop"] = crop_name
        bc["name"] = crop_name
        bc["confidence"] = int(bc.get("confidence", 90))
        bc["reason"] = bc.get("reason", "Favorable soil and weather conditions.")
        if "varieties" not in bc or not isinstance(bc["varieties"], list):
            bc["varieties"] = []
        result["best_crop"] = bc

        # Normalize recommended_crops
        rc_list = result.get("recommended_crops")
        if not isinstance(rc_list, list) or len(rc_list) == 0:
            rc_list = []

        normalized_rc = []
        for i, item in enumerate(rc_list):
            if not isinstance(item, dict):
                continue
            c_name = item.get("crop") or item.get("name") or f"Recommended Crop {i+1}"
            rank_val = int(item.get("recommendation_rank") or item.get("rank") or (i + 1))
            conf = int(item.get("confidence", 85))
            score = int(item.get("suitability_score", conf))

            why = item.get("why_recommended", [])
            why = why if isinstance(why, list) else [str(why)]

            risks = item.get("possible_risks", [])
            risks = risks if isinstance(risks, list) else [str(risks)]

            vars_list = item.get("varieties", [])
            vars_list = vars_list if isinstance(vars_list, list) else []

            normalized_rc.append({
                "recommendation_rank": rank_val,
                "rank": rank_val,
                "crop": c_name,
                "name": c_name,
                "confidence": conf,
                "suitability_score": score,
                "why_recommended": why,
                "varieties": vars_list,
                "best_sowing_time": str(item.get("best_sowing_time", "Optimal Season")),
                "crop_duration": str(item.get("crop_duration", "Standard")),
                "water_requirement": str(item.get("water_requirement", "Moderate")),
                "expected_yield": str(item.get("expected_yield", "High")),
                "market_demand": str(item.get("market_demand", "High")),
                "profitability": str(item.get("profitability", "High")),
                "possible_risks": risks
            })

        result["recommended_crops"] = normalized_rc

        # Normalize not_recommended
        nr_list = result.get("not_recommended")
        if not isinstance(nr_list, list):
            nr_list = []

        normalized_nr = []
        for item in nr_list:
            if isinstance(item, dict):
                nr_name = item.get("crop") or item.get("name") or "Unsuitable Crop"
                normalized_nr.append({
                    "crop": nr_name,
                    "name": nr_name,
                    "reason": str(item.get("reason", "Unfavorable soil or climate conditions."))
                })

        result["not_recommended"] = normalized_nr

        # Pydantic server-side validation
        validated_response = CropAdvisoryResponse.model_validate(result)

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
                        "best_crop": validated_response.best_crop.model_dump(),
                        "recommended_crops": [rc.model_dump() for rc in validated_response.recommended_crops],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    crop_col.insert_one(doc)
            except Exception as auth_err:
                print(f"Notice: Non-blocking auth state in crop advisory ({auth_err})")

        return validated_response

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Crop Advisory generation error: {str(e)}"
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