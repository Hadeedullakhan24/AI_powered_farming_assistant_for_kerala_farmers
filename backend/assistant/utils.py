"""
backend/assistant/utils.py
──────────────────────────
Shared utilities for the AI Assistant module.

Provides:
- numpy_to_wav()   : Convert float32 numpy array → WAV bytes
- TimedBlock       : Context manager measuring elapsed time
- format_elapsed() : Format milliseconds for display
"""

from __future__ import annotations

import io
import time
import wave
import logging
from contextlib import contextmanager
from typing import Generator

import numpy as np

logger = logging.getLogger("hexakrishi.assistant.utils")


# ── Audio Helpers ─────────────────────────────────────────────────────────────

def numpy_to_wav(audio_array: np.ndarray, sample_rate: int) -> bytes:
    """
    Convert a float32 numpy array to raw WAV bytes.

    Normalises the waveform to [-1, 1] then encodes as 16-bit PCM mono WAV.
    No external scipy dependency required.

    Args:
        audio_array: 1-D float32 numpy array containing waveform samples.
        sample_rate: Sample rate in Hz (e.g. 16000, 22050, 44100).

    Returns:
        WAV file contents as bytes.
    """
    peak = float(np.abs(audio_array).max())
    if peak > 0:
        audio_array = audio_array / peak

    samples_int16 = (audio_array * 32_767).astype(np.int16)

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)          # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(samples_int16.tobytes())

    return buf.getvalue()


# ── Performance Monitoring ────────────────────────────────────────────────────

class TimedBlock:
    """
    Context manager that measures wall-clock elapsed time.

    Usage::

        with TimedBlock() as tb:
            do_work()
        print(tb.elapsed_ms)   # float milliseconds
    """

    def __init__(self) -> None:
        self._start: float = 0.0
        self.elapsed_ms: float = 0.0

    def __enter__(self) -> "TimedBlock":
        self._start = time.perf_counter()
        return self

    def __exit__(self, *_) -> None:
        self.elapsed_ms = (time.perf_counter() - self._start) * 1_000


@contextmanager
def timed_call(label: str = "") -> Generator[TimedBlock, None, None]:
    """
    Convenience generator wrapping :class:`TimedBlock` with optional logging.

    Args:
        label: Human-readable name included in the debug log line.

    Yields:
        :class:`TimedBlock` instance whose ``elapsed_ms`` is populated on exit.
    """
    tb = TimedBlock()
    with tb:
        yield tb
    if label:
        logger.debug("[timing] %s completed in %.1f ms", label, tb.elapsed_ms)


def format_elapsed(ms: float) -> str:
    """
    Format a millisecond duration for human display.

    Examples:
        format_elapsed(42.3)    → "42ms"
        format_elapsed(1234.0)  → "1.23s"
    """
    if ms < 1_000:
        return f"{ms:.0f}ms"
    return f"{ms / 1_000:.2f}s"
