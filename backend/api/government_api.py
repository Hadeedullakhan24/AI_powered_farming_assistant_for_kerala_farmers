from fastapi import APIRouter, HTTPException
from backend.schemas.government_schema import FarmerProfileRequest, GovernmentAdvisoryResponse
from backend.services.government_service import (
    filter_eligible_schemes,
    filter_eligible_loans,
    calculate_financial_score,
    load_government_schemes,
    load_loan_schemes
)
from backend.services.government_ai_service import generate_government_advisory

router = APIRouter()


@router.post("/advisory", response_model=GovernmentAdvisoryResponse)
def get_government_advisory(request: FarmerProfileRequest):
    """Generate personalized AI Government Schemes & Financial Advisory for farmers."""
    try:
        eligible_schemes = filter_eligible_schemes(request)
        eligible_loans = filter_eligible_loans(request)
        score_data = calculate_financial_score(request, eligible_schemes, eligible_loans)

        advisory_result = generate_government_advisory(
            profile=request,
            eligible_schemes=eligible_schemes,
            eligible_loans=eligible_loans,
            score_data=score_data
        )

        return advisory_result

    except Exception as e:
        print("Government Advisory API Error:", e)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating government scheme advisory: {str(e)}"
        )


@router.get("/schemes")
def get_all_schemes():
    """Retrieve all stored government agricultural schemes."""
    try:
        return {
            "total": len(load_government_schemes()),
            "schemes": load_government_schemes()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/loans")
def get_all_loans():
    """Retrieve all stored agricultural loan schemes."""
    try:
        return {
            "total": len(load_loan_schemes()),
            "loans": load_loan_schemes()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
