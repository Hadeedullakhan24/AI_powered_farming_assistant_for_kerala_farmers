"""
backend/assistant/memory/store.py
──────────────────────────────────
Session-scoped conversation memory store.

Maintains a dict of session_id → ConversationMemory with TTL-based
automatic eviction, so the server never accumulates unbounded memory
from abandoned sessions.

Usage::

    store = get_memory_store()
    mem = store.get_or_create("uuid-session-id")
    mem.add_user_message("hello")
    mem.add_ai_message("hi there")
    history = mem.get_formatted_history()
"""

from __future__ import annotations

import logging
import threading
import time
from typing import Dict, Optional

logger = logging.getLogger("hexakrishi.assistant.memory")

# Seconds of inactivity before a session is evicted (default: 30 minutes).
_SESSION_TTL_SECONDS = 30 * 60
# Maximum number of message exchanges kept per session.
_MAX_HISTORY = 20


class ConversationMemory:
    """
    Stores conversation history for a single session.

    Each session keeps up to *max_history* turns (user + assistant pairs).
    """

    def __init__(self, max_history: int = _MAX_HISTORY) -> None:
        from collections import deque
        self._history: "deque[dict]" = deque(maxlen=max_history)

    # ── Mutators ──────────────────────────────────────────────────────────────

    def add_user_message(self, content: str) -> None:
        self._history.append({"role": "user", "content": content})

    def add_ai_message(self, content: str) -> None:
        self._history.append({"role": "assistant", "content": content})

    # ── Accessors ─────────────────────────────────────────────────────────────

    def get_history(self) -> list[dict]:
        """Return raw list of ``{"role": ..., "content": ...}`` dicts."""
        return list(self._history)

    def get_formatted_history(self) -> str:
        """
        Format history as a plain-text block suitable for insertion into a prompt.

        Returns empty string if no history exists.
        """
        if not self._history:
            return ""
        lines = []
        for msg in self._history:
            prefix = "User" if msg["role"] == "user" else "Assistant"
            lines.append(f"{prefix}: {msg['content']}")
        return "\n".join(lines)

    def clear(self) -> None:
        self._history.clear()

    def __len__(self) -> int:
        return len(self._history)


class _SessionEntry:
    """Internal wrapper tracking the memory + last-accessed timestamp."""

    def __init__(self) -> None:
        self.memory = ConversationMemory()
        self.last_accessed: float = time.monotonic()

    def touch(self) -> None:
        self.last_accessed = time.monotonic()

    def is_expired(self, ttl: float = _SESSION_TTL_SECONDS) -> bool:
        return (time.monotonic() - self.last_accessed) > ttl


class SessionMemoryStore:
    """
    In-process store of per-session :class:`ConversationMemory` objects.

    Thread-safe. Evicts sessions that have been inactive for longer than
    *ttl_seconds*.
    """

    def __init__(self, ttl_seconds: float = _SESSION_TTL_SECONDS) -> None:
        self._sessions: Dict[str, _SessionEntry] = {}
        self._lock = threading.Lock()
        self._ttl = ttl_seconds

    def get_or_create(self, session_id: str) -> ConversationMemory:
        """
        Return the memory for *session_id*, creating a new empty one if needed.

        Also evicts expired sessions on each access (lazy eviction).
        """
        with self._lock:
            self._evict_expired()
            if session_id not in self._sessions:
                self._sessions[session_id] = _SessionEntry()
                logger.debug("[Memory] New session created: %s", session_id[:8])
            entry = self._sessions[session_id]
            entry.touch()
            return entry.memory

    def get(self, session_id: str) -> Optional[ConversationMemory]:
        """Return memory for *session_id* or ``None`` if not found."""
        with self._lock:
            entry = self._sessions.get(session_id)
            if entry is None:
                return None
            entry.touch()
            return entry.memory

    def delete(self, session_id: str) -> None:
        """Explicitly remove a session from the store."""
        with self._lock:
            self._sessions.pop(session_id, None)

    def active_session_count(self) -> int:
        """Return number of currently tracked sessions."""
        with self._lock:
            return len(self._sessions)

    def _evict_expired(self) -> None:
        """Remove sessions past their TTL. Must be called while holding *_lock*."""
        expired = [
            sid for sid, entry in self._sessions.items()
            if entry.is_expired(self._ttl)
        ]
        for sid in expired:
            del self._sessions[sid]
            logger.debug("[Memory] Session evicted (TTL): %s", sid[:8])


# ── Module-level singleton ────────────────────────────────────────────────────

_store: Optional[SessionMemoryStore] = None
_store_lock = threading.Lock()


def get_memory_store() -> SessionMemoryStore:
    """Return the shared :class:`SessionMemoryStore` singleton."""
    global _store
    if _store is not None:
        return _store
    with _store_lock:
        if _store is None:
            _store = SessionMemoryStore()
            logger.info("[Memory] SessionMemoryStore initialised.")
    return _store
