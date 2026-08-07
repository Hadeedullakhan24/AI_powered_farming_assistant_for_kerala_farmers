"""
government_api.py (enhanced)
────────────────────────────
API layer for the Government Schemes & Financial Advisory module.

Endpoints:
  POST /api/government/advisory   — personalized AI advisory
  POST /api/government/refresh    — admin-only force refresh of scheme cache
  GET  /api/government/freshness  — per-source freshness summary
  GET  /api/government/schemes    — all cached schemes (backward-compat)
  GET  /api/government/loans      — all cached loans (backward-compat)
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from backend.schemas.government_schema import FarmerProfileRequest, GovernmentAdvisoryResponse
from backend.services.government_service import (
    filter_eligible_schemes,
    filter_eligible_loans,
    calculate_financial_score,
    load_government_schemes,
    load_loan_schemes,
)
from backend.services.government_ai_service import generate_government_advisory
from backend.services.scheme_fetcher_service import get_data_freshness_summary
from backend.services.loan_fetcher_service import get_loan_freshness_summary
from backend.jobs.scheme_refresh_job import trigger_manual_refresh

logger = logging.getLogger("hexakrishi.government_api")
router = APIRouter()


# ── POST /advisory ─────────────────────────────────────────────────────────────

@router.post("/advisory", response_model=GovernmentAdvisoryResponse)
def get_government_advisory(request: FarmerProfileRequest):
    """
    Generate personalized AI Government Schemes & Financial Advisory.

    Flow:
    1. Filter eligible schemes (deterministic engine — no AI)
    2. Filter eligible loans (deterministic)
    3. Calculate financial score (deterministic)
    4. Send eligible subset to Groq for ranking + explanation
    5. Attach data_freshness summary from fetcher services
    """
    try:
        eligible_schemes = filter_eligible_schemes(request)
        eligible_loans = filter_eligible_loans(request)
        score_data = calculate_financial_score(request, eligible_schemes, eligible_loans)

        advisory_result = generate_government_advisory(
            profile=request,
            eligible_schemes=eligible_schemes,
            eligible_loans=eligible_loans,
            score_data=score_data,
        )

        # Attach data freshness summary so frontend FreshnessBadge has real timestamps
        freshness = _build_freshness_summary(eligible_schemes, eligible_loans)
        advisory_result["data_freshness"] = freshness

        return advisory_result

    except Exception as e:
        logger.error(f"Government Advisory API Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating government scheme advisory: {str(e)}",
        )


# ── POST /refresh (admin-only) ─────────────────────────────────────────────────

@router.post("/refresh")
def force_refresh_schemes(x_admin_key: Optional[str] = Header(None)):
    """
    Admin-only endpoint to force-refresh scheme and loan liveness data.
    Protected by X-Admin-Key header check (simple secret).
    In production, replace with full JWT admin-role check.
    """
    # Simple admin key guard — sufficient for hackathon demo
    ADMIN_KEY = "hexakrishi_admin_2026"
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(
            status_code=403,
            detail="Admin access required. Provide X-Admin-Key header.",
        )

    try:
        result = trigger_manual_refresh()
        return {
            "status": "success",
            "message": "Scheme and loan cache refreshed successfully.",
            "details": result,
        }
    except Exception as e:
        logger.error(f"Manual refresh error: {e}")
        raise HTTPException(status_code=500, detail=f"Refresh failed: {str(e)}")


# ── GET /freshness ─────────────────────────────────────────────────────────────

@router.get("/freshness")
def get_data_freshness():
    """
    Returns last-verified timestamp and liveness status for every
    scheme and loan in the cache — used by the frontend FreshnessBadge.
    """
    try:
        scheme_freshness = get_data_freshness_summary()
        loan_freshness = get_loan_freshness_summary()
        return {
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "schemes": scheme_freshness,
            "loans": loan_freshness,
            "total_schemes": len(scheme_freshness),
            "total_loans": len(loan_freshness),
        }
    except Exception as e:
        logger.error(f"Freshness endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /schemes (backward-compat) ────────────────────────────────────────────

@router.get("/schemes")
def get_all_schemes():
    """Retrieve all stored government agricultural schemes (with freshness metadata)."""
    try:
        schemes = load_government_schemes()
        return {"total": len(schemes), "schemes": schemes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /loans (backward-compat) ──────────────────────────────────────────────

@router.get("/loans")
def get_all_loans():
    """Retrieve all stored agricultural loan schemes (with freshness metadata)."""
    try:
        loans = load_loan_schemes()
        return {"total": len(loans), "loans": loans}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Internal helpers ───────────────────────────────────────────────────────────

def _build_freshness_summary(
    eligible_schemes: list,
    eligible_loans: list,
) -> dict:
    """
    Build a compact freshness summary from the eligible subset.
    Surfaces the oldest (stale-est) verification timestamp so the
    frontend can show a single meaningful badge.
    """
    all_timestamps = []
    stale_count = 0
    ok_count = 0

    for item in eligible_schemes + eligible_loans:
        ts = item.get("last_verified")
        if ts:
            all_timestamps.append(ts)
        fok = item.get("freshness_ok")
        if fok is True:
            ok_count += 1
        elif fok is False:
            stale_count += 1

    oldest = min(all_timestamps) if all_timestamps else None
    newest = max(all_timestamps) if all_timestamps else None

    return {
        "oldest_verified": oldest,
        "newest_verified": newest,
        "sources_ok": ok_count,
        "sources_stale": stale_count,
        "note": (
            "All official sources verified." if stale_count == 0
            else f"{stale_count} source(s) could not be reached — serving cached data."
        ),
    }
