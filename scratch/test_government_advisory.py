import sys
import json
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.schemas.government_schema import FarmerProfileRequest
from backend.services.government_service import (
    filter_eligible_schemes,
    filter_eligible_loans,
    calculate_financial_score
)
from backend.services.government_ai_service import generate_government_advisory

def main():
    profile = FarmerProfileRequest(
        district="Kottayam",
        crop="Rubber",
        land_area=3.0,
        land_ownership="Owned",
        farmer_category="Marginal/Small (<5 acres)",
        annual_income=180000.0,
        loan_required="Yes",
        current_loan="None"
    )

    schemes = filter_eligible_schemes(profile)
    loans = filter_eligible_loans(profile)
    score_data = calculate_financial_score(profile, schemes, loans)

    print(f"Eligible schemes count: {len(schemes)}")
    print(f"Top eligible scheme: {schemes[0]['scheme_name']}")
    print(f"Financial score: {score_data}")

    result = generate_government_advisory(profile, schemes, loans, score_data)
    print("\n--- AI ADVISORY RESULT ---")
    print(json.dumps(result, indent=2))

    # Verify best scheme URL & best loan URL
    best_s = result.get("best_scheme", {})
    best_l = result.get("best_loan", {})
    print(f"\nBest Scheme Link: {best_s.get('official_apply_link')}")
    print(f"Best Loan Link: {best_l.get('official_apply_link')}")

if __name__ == "__main__":
    main()
