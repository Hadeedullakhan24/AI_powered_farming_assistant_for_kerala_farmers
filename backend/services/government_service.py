"""
government_service.py (enhanced)
─────────────────────────────────
Eligibility engine — deterministically filters cached/verified schemes and loans
against a farmer's profile BEFORE any AI call is made.

Key design decisions:
• Uses scheme_fetcher_service + loan_fetcher_service as data providers
  (reads from verified JSON cache, includes last_verified / source_url / freshness_ok)
• Fuzzy but deterministic matching: district/crop/category checks with "All" wildcard support
• Cash-miss fallback: if zero matches, returns top central + Kerala general schemes
  rather than an empty list (so the farmer always gets actionable information)
• Financial score: deterministic formula — no AI involvement
"""

import logging
from typing import Any

from backend.schemas.government_schema import FarmerProfileRequest
from backend.services.scheme_fetcher_service import get_all_schemes
from backend.services.loan_fetcher_service import get_all_loans

logger = logging.getLogger("hexakrishi.government_service")


# ── Scheme eligibility engine ─────────────────────────────────────────────────

def filter_eligible_schemes(profile: FarmerProfileRequest) -> list[dict[str, Any]]:
    """
    Deterministically filter all schemes against the farmer's profile.
    Returns eligible schemes with freshness metadata included.
    Falls back to top general schemes if no exact matches found.
    """
    all_schemes = get_all_schemes()
    eligible: list[dict[str, Any]] = []

    req_district = (profile.district or "").strip().lower()
    req_crop = (profile.crop or "").strip().lower()
    req_category = (profile.farmer_category or "").strip().lower()

    for scheme in all_schemes:
        # ── District Check ────────────────────────────────────────────────────
        dist = scheme.get("district", "All")
        if isinstance(dist, list):
            dist_match = any(
                d.lower() == req_district or d.lower() == "all" for d in dist
            )
        elif isinstance(dist, str):
            dist_match = dist.lower() in ("all", req_district)
        else:
            dist_match = False

        if not dist_match:
            continue

        # ── Crop Check ───────────────────────────────────────────────────────
        crops = [c.lower() for c in scheme.get("applicable_crops", ["All"])]
        crop_match = "all" in crops or any(
            req_crop in c or c in req_crop for c in crops
        )
        if not crop_match:
            continue

        # ── Category Check ────────────────────────────────────────────────────
        categories = [cat.lower() for cat in scheme.get("applicable_categories", ["All"])]
        category_match = "all" in categories or any(
            req_category in cat or cat in req_category for cat in categories
        )

        # Income exclusion: exclude schemes that explicitly require low-income
        # status when farmer's annual income exceeds ₹3 Lakhs and scheme
        # eligibility text mentions "income tax" exclusion
        if (
            profile.annual_income > 300000
            and "taxpayer" in scheme.get("eligibility", "").lower()
        ):
            category_match = False

        if category_match:
            # Relevance weight: explicit crop match > generic 'All' crops
            relevance = 0
            if any(req_crop in c or c in req_crop for c in crops if c != "all"):
                relevance += 10
            elif "all" in crops:
                relevance += 2

            if isinstance(dist, list) and any(d.lower() == req_district for d in dist if d.lower() != "all"):
                relevance += 5
            elif isinstance(dist, str) and dist.lower() == req_district:
                relevance += 5

            scheme_entry = dict(scheme)
            scheme_entry["_relevance"] = relevance
            eligible.append(scheme_entry)

    # Sort by relevance descending so crop-specific schemes appear at the top
    eligible.sort(key=lambda s: s.get("_relevance", 0), reverse=True)
    for s in eligible:
        s.pop("_relevance", None)

    # ── Cache-miss fallback: always give farmer something to act on ───────────
    if not eligible:
        logger.info(
            f"No exact scheme match for district={profile.district}, crop={profile.crop} "
            f"— returning top general schemes as fallback."
        )
        eligible = [
            s for s in all_schemes
            if s.get("state") in ("Central", "Kerala")
        ][:6]

    return eligible


# ── Loan eligibility engine ───────────────────────────────────────────────────

def filter_eligible_loans(profile: FarmerProfileRequest) -> list[dict[str, Any]]:
    """
    Filter loans against the farmer's profile.
    KCC and Kerala Bank are almost universally eligible for farmers;
    if loan_required = Yes, all loans are included.
    """
    all_loans = get_all_loans()
    eligible_loans: list[dict[str, Any]] = []

    is_loan_req = (profile.loan_required or "").strip().lower() in (
        "yes", "true", "1", "required"
    )

    for loan in all_loans:
        loan_name_lower = loan.get("loan_name", "").lower()
        # KCC and Kerala Bank are universal — include for all farmers
        if "kisan credit card" in loan_name_lower or "kerala bank" in loan_name_lower:
            eligible_loans.append(loan)
        elif is_loan_req:
            eligible_loans.append(loan)

    # Fallback: never return empty
    return eligible_loans if eligible_loans else all_loans[:3]


# ── Financial score calculator ────────────────────────────────────────────────

def calculate_financial_score(
    profile: FarmerProfileRequest,
    eligible_schemes: list[dict[str, Any]],
    eligible_loans: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Deterministic financial score (0–100) based on scheme availability,
    loan availability, land ownership, and farmer category.
    No AI involved — pure rule-based calculation.
    """
    score = 50  # Baseline

    # Scheme availability bonus (each scheme = +4, max +24)
    score += min(len(eligible_schemes) * 4, 24)

    # Loan availability bonus
    if eligible_loans:
        score += 10

    # Land ownership risk adjustment
    ownership = (profile.land_ownership or "").strip().lower()
    if ownership == "owned":
        score += 10
    elif ownership in ("leased", "tenant"):
        score += 5

    # Small/Marginal farmer subsidy access bonus
    cat_lower = (profile.farmer_category or "").lower()
    if (
        profile.land_area <= 5.0
        or "marginal" in cat_lower
        or "small" in cat_lower
        or "sc/st" in cat_lower
        or "women" in cat_lower
    ):
        score += 6

    score = max(0, min(100, score))

    level = "High" if score >= 75 else "Medium" if score >= 55 else "Low"
    return {"score": score, "level": level}


# ── Backward compatibility shims (used by existing government_api.py) ─────────

def load_government_schemes() -> list[dict[str, Any]]:
    """Shim: existing API routes call this — now delegates to fetcher."""
    return get_all_schemes()


def load_loan_schemes() -> list[dict[str, Any]]:
    """Shim: existing API routes call this — now delegates to fetcher."""
    return get_all_loans()
