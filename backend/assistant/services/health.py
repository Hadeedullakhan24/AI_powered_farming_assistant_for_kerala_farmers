"""
backend/assistant/services/health.py
─────────────────────────────────────
Health check service for all AI Assistant components.

Exposes get_assistant_health() used by GET /api/assistant/health.
"""

from __future__ import annotations

import logging
import os
from typing import Any

logger = logging.getLogger("hexakrishi.assistant.health")


def get_assistant_health() -> dict[str, Any]:
    """
    Collect health / status information for every assistant component.

    Returns a structured dict with keys:
    - status: "healthy" | "degraded" | "unhealthy"
    - components: dict of component_name → {"status", "detail"}
    """
    components: dict[str, dict[str, Any]] = {}

    # ── Groq API ──────────────────────────────────────────────────────────────
    try:
        from backend.assistant.services.groq_client import get_groq_client
        get_groq_client()
        components["groq_llm"] = {"status": "ok", "detail": "Groq client ready"}
    except Exception as exc:
        components["groq_llm"] = {"status": "error", "detail": str(exc)}

    # ── FAISS / RAG ───────────────────────────────────────────────────────────
    try:
        from backend.assistant.chat.rag import get_rag_retriever
        retriever = get_rag_retriever()
        if retriever is not None:
            components["faiss_rag"] = {"status": "ok", "detail": "FAISS index loaded"}
        else:
            components["faiss_rag"] = {
                "status": "unavailable",
                "detail": "RAG not loaded — LLM fallback active",
            }
    except Exception as exc:
        components["faiss_rag"] = {"status": "error", "detail": str(exc)}

    # ── Whisper STT ───────────────────────────────────────────────────────────
    enable_whisper = os.getenv("ENABLE_WHISPER", "false").lower() == "true"
    if enable_whisper:
        try:
            from backend.assistant.speech.whisper import get_whisper_manager
            mgr = get_whisper_manager()
            if mgr.is_loaded():
                components["whisper_stt"] = {
                    "status": "ok",
                    "detail": f"Model '{mgr.model_size}' loaded",
                }
            else:
                components["whisper_stt"] = {
                    "status": "loading",
                    "detail": "Whisper not yet loaded",
                }
        except Exception as exc:
            components["whisper_stt"] = {"status": "error", "detail": str(exc)}
    else:
        components["whisper_stt"] = {
            "status": "disabled",
            "detail": "ENABLE_WHISPER=false — browser Web Speech API in use",
        }

    # ── TTS ───────────────────────────────────────────────────────────────────
    try:
        from backend.assistant.speech.tts import get_tts_manager
        tts = get_tts_manager()
        cached = list(tts.cached_languages())
        components["tts"] = {
            "status": "ok",
            "detail": f"MMS-TTS ready, cached languages: {cached or 'none yet'}",
        }
    except Exception as exc:
        components["tts"] = {"status": "error", "detail": str(exc)}

    # ── Derive overall status ─────────────────────────────────────────────────
    statuses = [c["status"] for c in components.values()]
    if "error" in statuses:
        overall = "degraded"
    else:
        overall = "healthy"

    return {
        "status": overall,
        "components": components,
    }
