from fastapi import APIRouter, HTTPException

from backend.services.groq_services import get_treatment
import backend.services.prediction_state as state

router = APIRouter(
    prefix="/api",
    tags=["Treatment"]
)


@router.get("/treatment")
def treatment():

    if state.last_prediction is None:
        raise HTTPException(
            status_code=400,
            detail="No disease has been predicted yet."
        )

    return get_treatment(
        crop=state.last_prediction["crop"],
        disease=state.last_prediction["disease"]
    )