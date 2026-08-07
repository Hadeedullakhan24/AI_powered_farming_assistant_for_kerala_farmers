"""
scheme_refresh_job.py
─────────────────────
APScheduler background job that periodically re-verifies government scheme
and loan data from official sources.

Schedule: Daily at 03:00 AM (server local time) — low-traffic window.

What it does:
1. Calls scheme_fetcher_service.refresh_all_schemes()
   → HTTP HEAD to each scheme's official_website (allow-listed only)
   → Updates last_verified + freshness_ok in the JSON cache file
2. Calls loan_fetcher_service.refresh_all_loans() — same pattern for loans
3. Logs a summary; never raises (graceful degradation: stale cache served on error)

Integration: get_scheduler() is called from app.py lifespan event.
"""

import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

logger = logging.getLogger("hexakrishi.refresh_job")

# Module-level singleton so app.py can import get_scheduler once
_scheduler: AsyncIOScheduler | None = None


def _run_refresh_job() -> None:
    """The actual refresh logic — called by the scheduler."""
    logger.info("🔄 [RefreshJob] Starting scheduled scheme & loan refresh...")
    try:
        from backend.services.scheme_fetcher_service import refresh_all_schemes
        scheme_summary = refresh_all_schemes()
        logger.info(f"✅ [RefreshJob] Schemes refreshed: {scheme_summary}")
    except Exception as e:
        logger.error(f"❌ [RefreshJob] Scheme refresh failed: {e}")

    try:
        from backend.services.loan_fetcher_service import refresh_all_loans
        loan_summary = refresh_all_loans()
        logger.info(f"✅ [RefreshJob] Loans refreshed: {loan_summary}")
    except Exception as e:
        logger.error(f"❌ [RefreshJob] Loan refresh failed: {e}")

    logger.info("🔄 [RefreshJob] Scheduled refresh complete.")


def get_scheduler() -> AsyncIOScheduler:
    """
    Return (and lazily create) the module-level APScheduler instance.
    Configured to run _run_refresh_job daily at 03:00.
    """
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")
        _scheduler.add_job(
            _run_refresh_job,
            trigger=CronTrigger(hour=3, minute=0),  # 3:00 AM IST daily
            id="scheme_refresh",
            name="Government Scheme & Loan Freshness Refresh",
            replace_existing=True,
            misfire_grace_time=3600,  # allow up to 1 hour late
        )
        logger.info("📅 [RefreshJob] Scheduler configured — daily at 03:00 IST")
    return _scheduler


def trigger_manual_refresh() -> dict:
    """
    On-demand refresh — called by the admin POST /api/government/refresh endpoint.
    Runs synchronously (not via scheduler) so the HTTP response can confirm completion.
    """
    logger.info("🔄 [ManualRefresh] Admin-triggered manual refresh...")
    results: dict = {}

    try:
        from backend.services.scheme_fetcher_service import refresh_all_schemes
        results["schemes"] = refresh_all_schemes()
    except Exception as e:
        logger.error(f"❌ [ManualRefresh] Scheme refresh error: {e}")
        results["schemes"] = {"error": str(e)}

    try:
        from backend.services.loan_fetcher_service import refresh_all_loans
        results["loans"] = refresh_all_loans()
    except Exception as e:
        logger.error(f"❌ [ManualRefresh] Loan refresh error: {e}")
        results["loans"] = {"error": str(e)}

    logger.info(f"✅ [ManualRefresh] Complete: {results}")
    return results
