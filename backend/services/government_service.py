import json
from pathlib import Path
from typing import Dict, List, Any
from backend.schemas.government_schema import FarmerProfileRequest

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


def load_government_schemes() -> List[Dict[str, Any]]:
    file_path = DATA_DIR / "government_schemes.json"
    if not file_path.exists():
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_loan_schemes() -> List[Dict[str, Any]]:
    file_path = DATA_DIR / "loan_schemes.json"
    if not file_path.exists():
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def filter_eligible_schemes(profile: FarmerProfileRequest) -> List[Dict[str, Any]]:
    all_schemes = load_government_schemes()
    eligible = []

    req_district = profile.district.strip().lower() if profile.district else ""
    req_crop = profile.crop.strip().lower() if profile.crop else ""
    req_category = profile.farmer_category.strip().lower() if profile.farmer_category else ""

    for scheme in all_schemes:
        # District Check
        dist = scheme.get("district", "All")
        dist_match = False
        if dist == "All":
            dist_match = True
        elif isinstance(dist, list):
            dist_match = any(d.lower() == req_district for d in dist)
        elif isinstance(dist, str):
            dist_match = (dist.lower() == req_district or dist.lower() == "all")

        if not dist_match:
            continue

        # Crop Check
        crops = [c.lower() for c in scheme.get("applicable_crops", ["All"])]
        crop_match = "all" in crops or any(req_crop in c or c in req_crop for c in crops)
        if not crop_match:
            continue

        # Category Check
        categories = [cat.lower() for cat in scheme.get("applicable_categories", ["All"])]
        category_match = ("all" in categories or
                          any(req_category in cat or cat in req_category for cat in categories))

        # Income rule check for high-income PM-KISAN exclude
        if profile.annual_income > 300000 and "taxpayer" in scheme.get("eligibility", "").lower():
            # Exclude or lower priority
            category_match = False

        if category_match:
            eligible.append(scheme)

    # If too few schemes match due to strict strings, return top general schemes
    if not eligible:
        eligible = [s for s in all_schemes if s.get("state") == "Central" or s.get("state") == "Kerala"][:6]

    return eligible


def filter_eligible_loans(profile: FarmerProfileRequest) -> List[Dict[str, Any]]:
    all_loans = load_loan_schemes()
    eligible_loans = []

    is_loan_req = profile.loan_required.strip().lower() in ["yes", "true", "1", "required"]

    for loan in all_loans:
        # KCC and Kerala Bank are almost universally eligible for farmers
        if "kisan credit card" in loan.get("loan_name", "").lower() or "kerala bank" in loan.get("loan_name", "").lower():
            eligible_loans.append(loan)
        elif is_loan_req:
            eligible_loans.append(loan)

    return eligible_loans if eligible_loans else all_loans[:3]


def calculate_financial_score(profile: FarmerProfileRequest, eligible_schemes: List[Dict[str, Any]], eligible_loans: List[Dict[str, Any]]) -> Dict[str, Any]:
    score = 50  # Baseline

    # Scheme availability bonus
    scheme_count = len(eligible_schemes)
    score += min(scheme_count * 4, 24)

    # Loan availability bonus
    if eligible_loans:
        score += 10

    # Land ownership risk evaluation
    ownership = profile.land_ownership.strip().lower()
    if ownership == "owned":
        score += 10
    elif ownership in ["leased", "tenant"]:
        score += 5

    # Small/Marginal farmer subsidy bonus
    if profile.land_area <= 5.0 or "marginal" in profile.farmer_category.lower() or "small" in profile.farmer_category.lower():
        score += 6

    # Clamp 0-100
    score = max(0, min(100, score))

    if score >= 75:
        level = "High"
    elif score >= 55:
        level = "Medium"
    else:
        level = "Low"

    return {
        "score": score,
        "level": level
    }
