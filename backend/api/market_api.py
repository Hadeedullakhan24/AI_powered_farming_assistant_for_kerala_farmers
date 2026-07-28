from fastapi import APIRouter, HTTPException
import traceback

from backend.schemas.market_schema import MarketRequest
from backend.schemas.market_response_schema import MarketResponse
from backend.services.market_service import MarketService

router = APIRouter(
    prefix="/market",
    tags=["Market Intelligence"]
)


@router.post(
    "/market",
    response_model=MarketResponse
)
def get_market(request: MarketRequest):

    try:

        service = MarketService()

        result = service.get_market_data(
            crop=request.crop,
            district=request.district
        )

        return result

    except Exception as e:

        print("\n========== MARKET API ERROR ==========")
        traceback.print_exc()
        print("======================================\n")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )