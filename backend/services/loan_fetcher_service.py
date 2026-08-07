"""
loan_fetcher_service.py
───────────────────────
Pluggable provider for agricultural loan data — mirrors scheme_fetcher_service
but for the loan_schemes.json cache.

Same pattern:
• PRIMARY PATH  → Read from backend/data/loan_schemes.json (verified cache)
• REFRESH PATH  → HTTP HEAD liveness check per loan's official_website
• ALLOW-LIST    → Only checks official banking / government finance domains
• NEVER         → Fabricates loan details, amounts, or interest rates
"""

import json
import logging
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

logger = logging.getLogger("hexakrishi.loan_fetcher")

# ── Paths ────────────────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
LOANS_FILE = DATA_DIR / "loan_schemes.json"

# ── Official banking / finance domain allow-list ──────────────────────────────
OFFICIAL_FINANCE_ALLOWLIST = {
    "kisan.gov.in",
    "pmkisan.gov.in",
    "keralabank.co.in",
    "agriinfra.gov.in",
    "nabard.gov.in",
    "nabard.org",
    "mudra.org.in",
    "sbi.co.in",
    "canarabank.com",
    "rbi.org.in",
    "jansamarth.in",
}

_HTTP_TIMEOUT = 8


def _domain_from_url(url: str) -> str:
    url = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
    return url.split("/")[0]


def _is_official_finance_domain(url: str) -> bool:
    domain = _domain_from_url(url)
    for allowed in OFFICIAL_FINANCE_ALLOWLIST:
        if domain == allowed or domain.endswith("." + allowed):
            return True
    return False


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Core functions ────────────────────────────────────────────────────────────

def load_loans_raw() -> list[dict[str, Any]]:
    """Load loans from the JSON cache file."""
    if not LOANS_FILE.exists():
        logger.error(f"Loans cache file not found: {LOANS_FILE}")
        return []
    try:
        with open(LOANS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            logger.error("Loans JSON is not a list — returning empty.")
            return []
        return data
    except Exception as e:
        logger.error(f"Failed to read loans cache: {e}")
        return []


def save_loans_raw(loans: list[dict[str, Any]]) -> None:
    """Persist updated loans back to the JSON cache file."""
    try:
        with open(LOANS_FILE, "w", encoding="utf-8") as f:
            json.dump(loans, f, ensure_ascii=False, indent=2)
        logger.info(f"Loans cache updated — {len(loans)} records saved.")
    except Exception as e:
        logger.error(f"Failed to save loans cache: {e}")


def get_all_loans() -> list[dict[str, Any]]:
    """Return all loans with freshness metadata injected."""
    loans = load_loans_raw()
    file_mtime = (
        datetime.fromtimestamp(LOANS_FILE.stat().st_mtime, tz=timezone.utc).isoformat()
        if LOANS_FILE.exists() else _now_iso()
    )
    enriched = []
    for loan in loans:
        l = deepcopy(loan)
        if "last_verified" not in l:
            l["last_verified"] = file_mtime
        if "source_url" not in l:
            l["source_url"] = l.get("official_website", "")
        if "freshness_ok" not in l:
            l["freshness_ok"] = True
        enriched.append(l)
    return enriched


def verify_loan_liveness(loan: dict[str, Any]) -> dict[str, Any]:
    """
    HTTP HEAD check against the loan's official website.
    Only checks allow-listed banking/finance domains.
    """
    url = loan.get("official_website", "")
    if not url:
        loan["freshness_ok"] = False
        return loan

    if not _is_official_finance_domain(url):
        logger.warning(f"Skipping liveness check — domain not in allow-list: {url}")
        loan["freshness_ok"] = None
        return loan

    try:
        resp = requests.head(
            url,
            timeout=_HTTP_TIMEOUT,
            allow_redirects=True,
            headers={"User-Agent": "HexaKrishi-Refresh-Bot/1.0 (agriculture advisory)"},
        )
        if resp.status_code < 400:
            loan["freshness_ok"] = True
            loan["last_verified"] = _now_iso()
            logger.info(f"✅ Loan liveness OK: {url} → {resp.status_code}")
        else:
            loan["freshness_ok"] = False
            logger.warning(f"⚠️ Loan liveness FAIL: {url} → {resp.status_code}")
    except requests.RequestException as e:
        loan["freshness_ok"] = False
        logger.warning(f"⚠️ Loan liveness ERROR: {url} → {e}")

    return loan


def refresh_all_loans() -> dict[str, Any]:
    """
    Full refresh cycle for loans — verify liveness for each, save back.
    Called by scheme_refresh_job.py and the admin /refresh endpoint.
    """
    loans = load_loans_raw()
    ok_count = 0
    fail_count = 0
    skip_count = 0

    updated = []
    for loan in loans:
        verified = verify_loan_liveness(deepcopy(loan))
        updated.append(verified)
        if verified.get("freshness_ok") is True:
            ok_count += 1
        elif verified.get("freshness_ok") is False:
            fail_count += 1
        else:
            skip_count += 1

    save_loans_raw(updated)
    return {
        "refreshed_at": _now_iso(),
        "total": len(updated),
        "liveness_ok": ok_count,
        "liveness_fail": fail_count,
        "skipped_not_in_allowlist": skip_count,
    }


def get_loan_freshness_summary() -> list[dict[str, Any]]:
    """Returns {loan_id, loan_name, source_url, last_verified, freshness_ok} per loan."""
    loans = get_all_loans()
    return [
        {
            "loan_id": l.get("loan_id", ""),
            "loan_name": l.get("loan_name", ""),
            "source_url": l.get("source_url", l.get("official_website", "")),
            "last_verified": l.get("last_verified", "unknown"),
            "freshness_ok": l.get("freshness_ok", None),
        }
        for l in loans
    ]
