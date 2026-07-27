import os
import tempfile

from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from backend.models.disease.predict import DiseasePredictor
import backend.services.prediction_state as state

router = APIRouter(
    prefix="/api/disease",
    tags=["Disease Detection"]
)


@router.post("/predict")
async def predict_disease(
    crop: str = Form(...),
    image: UploadFile = File(...)
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

        # Store the last prediction
        state.last_prediction = {
            "crop": result["crop"],
            "disease": result["prediction"]
        }

        # Return only prediction
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)