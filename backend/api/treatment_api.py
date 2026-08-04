from fastapi import APIRouter, HTTPException

from backend.services.groq_services import get_treatment
import backend.services.prediction_state as state

router = APIRouter(
    prefix="/api",
    tags=["Treatment"]
)


@router.get("/treatment")
def treatment(crop: str = None, disease: str = None):

    if not crop or not disease:
        if state.last_prediction is None:
            crop = "paddy"
            disease = "bacterial leaf blight"
        else:
            crop = state.last_prediction["crop"]
            disease = state.last_prediction["disease"]

    return get_treatment(
        crop=crop,
        disease=disease
    )