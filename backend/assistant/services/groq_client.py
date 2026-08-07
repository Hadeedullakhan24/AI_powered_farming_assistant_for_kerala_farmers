"""
backend/assistant/services/groq_client.py
─────────────────────────────────────────
Thread-safe Groq API client singleton.

Loads from environment once and reuses the same instance across all
assistant modules — prevents duplicate Groq client initialisation.
"""

from __future__ import annotations

import logging
import os
import threading
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# Load .env from the backend directory
_BASE_DIR = Path(__file__).resolve().parents[3]
load_dotenv(_BASE_DIR / ".env")

logger = logging.getLogger("hexakrishi.assistant.groq_client")

_client: Optional[object] = None
_lock = threading.Lock()


def get_groq_client():
    """
    Return the shared Groq client singleton.

    Thread-safe: the client is created exactly once even under concurrent
    first-call scenarios.

    Returns:
        groq.Groq instance.

    Raises:
        RuntimeError: If GROQ_API_KEY is missing or Groq cannot be imported.
    """
    global _client
    if _client is not None:
        return _client

    with _lock:
        if _client is not None:
            return _client

        api_key = os.getenv("GROQ_API_KEY", "")
        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Add it to backend/.env."
            )

        try:
            from groq import Groq  # type: ignore
            _client = Groq(api_key=api_key)
            logger.info("[GroqClient] Groq client initialised successfully.")
        except ImportError as exc:
            raise RuntimeError(
                "groq package not installed. Run: pip install groq"
            ) from exc

    return _client


def safe_parse_json(result_text: str) -> dict:
    """
    Extract and parse the first JSON object found in *result_text*.

    Handles model outputs that wrap JSON in markdown code fences.

    Args:
        result_text: Raw LLM output string.

    Returns:
        Parsed Python dict.

    Raises:
        json.JSONDecodeError: If no valid JSON is found.
    """
    import json
    import re

    text = result_text.strip()
    # Strip markdown fences like ```json … ```
    text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
    text = re.sub(r"\n?```$", "", text).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start : end + 1]

    return json.loads(text)
