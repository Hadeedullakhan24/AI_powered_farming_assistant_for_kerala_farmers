import os
import tempfile
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, File, Form, UploadFile, HTTPException, Header

from backend.models.disease.predict import DiseasePredictor
import backend.services.prediction_state as state
from backend.database.mongo import get_disease_history_collection
from backend.api.auth_api import get_current_user_from_token

router = APIRouter(
    prefix="/api/disease",
    tags=["Disease Detection"]
)


@router.post("/predict")
async def predict_disease(
    crop: str = Form(...),
    image: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    temp_path = None

    try:
        # Save uploaded image temporarily
        suffix = os.path.splitext(image.filename)[1]

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            temp.write(await image.read())
            temp_path = temp.name

        # Load predictor
        predictor = DiseasePredictor(crop)

        # Predict disease
        result = predictor.predict(temp_path)

        # Store the last prediction in global state
        state.last_prediction = {
            "crop": result["crop"],
            "disease": result["prediction"]
        }

        # Store in MongoDB if authenticated
        if authorization:
            try:
                user = get_current_user_from_token(authorization)
                disease_col = get_disease_history_collection()
                if disease_col is not None:
                    doc = {
                        "user_id": user.get("id"),
                        "email": user.get("email"),
                        "crop": result["crop"],
                        "prediction": result["prediction"],
                        "confidence": result.get("confidence"),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    disease_col.insert_one(doc)
            except Exception as auth_err:
                print(f"Notice: Non-blocking auth state in disease prediction ({auth_err})")

        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/history")
def get_disease_history(authorization: Optional[str] = Header(None)):
    user = get_current_user_from_token(authorization)
    disease_col = get_disease_history_collection()

    if disease_col is None:
        return {"history": []}

    records = list(disease_col.find({"email": user.get("email")}).sort("timestamp", -1).limit(50))
    for r in records:
        r["id"] = str(r["_id"])
        r.pop("_id", None)

    return {"history": records}