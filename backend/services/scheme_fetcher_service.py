"""
scheme_fetcher_service.py
─────────────────────────
Pluggable provider for government scheme data.

Architecture
────────────
• PRIMARY PATH  → Load from verified JSON cache (backend/data/government_schemes.json)
  - The JSON file acts as the persistent verified cache.
  - Every record has: scheme_id, scheme_name, …, source_url, last_verified, freshness_ok.

• REFRESH PATH  → Called by scheme_refresh_job.py on a schedule (or via admin API).
  - Sends HTTP HEAD to each scheme's official_website.
  - If response is 2xx/3xx → marks freshness_ok=True, updates last_verified timestamp.
  - If unreachable → marks freshness_ok=False, serves stale data with warning flag.
  - Never fabricates or modifies scheme *content* — only updates freshness metadata.

• CACHE-MISS FALLBACK → If a district/crop combo has zero matches, returns top general
  Central + Kerala schemes (never an empty list to the farmer).

• ALLOW-LIST       → HTTP requests are restricted to official government/statutory domains.
  Any domain NOT in the allow-list is skipped; its freshness is marked as "unverified".
"""

import json
import logging
import re
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

logger = logging.getLogger("hexakrishi.scheme_fetcher")

# ── Paths ────────────────────────────────────────────────────────────────────
DATA_DIR = Path(__file__).resolve().parents[1] / "data"
SCHEMES_FILE = DATA_DIR / "government_schemes.json"

# ── Official domain allow-list (refresh calls are restricted to these) ────────
OFFICIAL_DOMAIN_ALLOWLIST = {
    "pmkisan.gov.in",
    "pmfby.gov.in",
    "aims.kerala.gov.in",
    "keralaagriculture.gov.in",
    "agrimachinery.nic.in",
    "pgsindia-ncof.gov.in",
    "midh.gov.in",
    "pmksy.gov.in",
    "coconutboard.gov.in",
    "indianspices.com",
    "pmkusum.mnre.gov.in",
    "shm.kerala.gov.in",
    "pmfme.mofpi.gov.in",
    "karshakakshema.kerala.gov.in",
    "agriinfra.gov.in",
    "soilhealth.dac.gov.in",
    "rubberboard.gov.in",
    "vfpck.org",
    "pmmsy.dof.gov.in",
    "dairy.kerala.gov.in",
    "nbhm.gov.in",
    "maandhan.in",
    "kisan.gov.in",
    "nabard.org",
    "rbi.org.in",
    "nabard.gov.in",
}

_HTTP_TIMEOUT = 8  # seconds for liveness check


# ── Internal helpers ─────────────────────────────────────────────────────────

def _domain_from_url(url: str) -> str:
    """Extract bare domain from a URL string."""
    url = url.lower().replace("https://", "").replace("http://", "").replace("www.", "")
    return url.split("/")[0]


def _is_official_domain(url: str) -> bool:
    """Return True only if the URL belongs to an allow-listed official domain."""
    domain = _domain_from_url(url)
    # Allow exact matches and subdomains of any allow-listed domain
    for allowed in OFFICIAL_DOMAIN_ALLOWLIST:
        if domain == allowed or domain.endswith("." + allowed):
            return True
    return False


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Core functions ────────────────────────────────────────────────────────────

def load_schemes_raw() -> list[dict[str, Any]]:
    """
    Load schemes from the JSON cache file.
    Returns an empty list gracefully if the file is missing or malformed.
    """
    if not SCHEMES_FILE.exists():
        logger.error(f"Schemes cache file not found: {SCHEMES_FILE}")
        return []
    try:
        with open(SCHEMES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, list):
            logger.error("Schemes JSON is not a list — returning empty.")
            return []
        return data
    except Exception as e:
        logger.error(f"Failed to read schemes cache: {e}")
        return []


def save_schemes_raw(schemes: list[dict[str, Any]]) -> None:
    """
    Persist updated schemes back to the JSON cache file.
    Used by the refresh job to update freshness metadata.
    """
    try:
        with open(SCHEMES_FILE, "w", encoding="utf-8") as f:
            json.dump(schemes, f, ensure_ascii=False, indent=2)
        logger.info(f"Schemes cache updated — {len(schemes)} records saved.")
    except Exception as e:
        logger.error(f"Failed to save schemes cache: {e}")


def get_all_schemes() -> list[dict[str, Any]]:
    """
    Return all schemes with freshness metadata injected.
    If a scheme is missing last_verified, it defaults to the file's mtime.
    """
    schemes = load_schemes_raw()
    file_mtime = (
        datetime.fromtimestamp(SCHEMES_FILE.stat().st_mtime, tz=timezone.utc).isoformat()
        if SCHEMES_FILE.exists() else _now_iso()
    )
    enriched = []
    for s in schemes:
        scheme = deepcopy(s)
        # Inject freshness metadata if absent (backward compatibility)
        if "last_verified" not in scheme:
            scheme["last_verified"] = file_mtime
        if "source_url" not in scheme:
            scheme["source_url"] = scheme.get("official_website", "")
        if "freshness_ok" not in scheme:
            scheme["freshness_ok"] = True
        enriched.append(scheme)
    return enriched


def verify_scheme_liveness(scheme: dict[str, Any]) -> dict[str, Any]:
    """
    Send an HTTP HEAD request to the scheme's official_website.
    Update freshness_ok and last_verified in the scheme dict.
    Only checks allow-listed official domains — skips others silently.
    """
    url = scheme.get("official_website", "")
    if not url:
        scheme["freshness_ok"] = False
        return scheme

    if not _is_official_domain(url):
        logger.warning(f"Skipping liveness check — domain not in allow-list: {url}")
        scheme["freshness_ok"] = None  # "unverified" rather than False
        return scheme

    try:
        resp = requests.head(
            url,
            timeout=_HTTP_TIMEOUT,
            allow_redirects=True,
            headers={"User-Agent": "HexaKrishi-Refresh-Bot/1.0 (agriculture advisory)"},
        )
        if resp.status_code < 400:
            scheme["freshness_ok"] = True
            scheme["last_verified"] = _now_iso()
            logger.info(f"✅ Liveness OK: {url} → {resp.status_code}")
        else:
            scheme["freshness_ok"] = False
            logger.warning(f"⚠️ Liveness FAIL: {url} → {resp.status_code}")
    except requests.RequestException as e:
        scheme["freshness_ok"] = False
        logger.warning(f"⚠️ Liveness ERROR: {url} → {e}")

    return scheme


def refresh_all_schemes() -> dict[str, Any]:
    """
    Full refresh cycle: load all schemes, verify liveness for each, save back.
    Returns a summary dict with counts.
    Called by scheme_refresh_job.py and the admin /refresh endpoint.
    """
    schemes = load_schemes_raw()
    ok_count = 0
    fail_count = 0
    skip_count = 0

    updated = []
    for s in schemes:
        verified = verify_scheme_liveness(deepcopy(s))
        updated.append(verified)
        if verified.get("freshness_ok") is True:
            ok_count += 1
        elif verified.get("freshness_ok") is False:
            fail_count += 1
        else:
            skip_count += 1

    save_schemes_raw(updated)
    summary = {
        "refreshed_at": _now_iso(),
        "total": len(updated),
        "liveness_ok": ok_count,
        "liveness_fail": fail_count,
        "skipped_not_in_allowlist": skip_count,
    }
    logger.info(f"Refresh complete: {summary}")
    return summary


def get_data_freshness_summary() -> list[dict[str, Any]]:
    """
    Returns a list of {scheme_name, source_url, last_verified, freshness_ok}
    for every scheme — consumed by the /freshness API endpoint.
    """
    schemes = get_all_schemes()
    return [
        {
            "scheme_id": s.get("scheme_id", ""),
            "scheme_name": s.get("scheme_name", ""),
            "source_url": s.get("source_url", s.get("official_website", "")),
            "last_verified": s.get("last_verified", "unknown"),
            "freshness_ok": s.get("freshness_ok", None),
        }
        for s in schemes
    ]
