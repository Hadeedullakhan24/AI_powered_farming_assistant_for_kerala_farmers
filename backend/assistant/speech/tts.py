"""
backend/assistant/speech/tts.py
───────────────────────────────
Meta MMS-TTS model manager with intelligent LRU caching and auto-eviction.

Caches models per language with a maximum capacity (e.g. 3 models).
Automatically unloads least-recently-used models when capacity is exceeded to bound RAM usage.
"""

from __future__ import annotations

import logging
import threading
from collections import OrderedDict
from typing import Dict, Tuple, Optional, Set

from backend.assistant.utils import numpy_to_wav

logger = logging.getLogger("hexakrishi.assistant.speech.tts")

MMS_MODEL_MAP: dict[str, str] = {
    "en": "facebook/mms-tts-eng",
    "ml": "facebook/mms-tts-mal",
    "hi": "facebook/mms-tts-hin",
    "ta": "facebook/mms-tts-tam",
    "kn": "facebook/mms-tts-kan",
    "te": "facebook/mms-tts-tel",
}

# Maximum number of TTS models held in memory simultaneously
MAX_TTS_MODELS_IN_RAM = 3

_tts_manager_instance: Optional["TTSManager"] = None
_tts_lock = threading.Lock()


class TTSManager:
    """
    Singleton manager for Text-to-Speech models using Meta MMS-TTS.
    Implements an LRU cache with automatic model unloading.
    """

    def __init__(self, max_models: int = MAX_TTS_MODELS_IN_RAM) -> None:
        self.max_models = max_models
        # OrderedDict stores: lang_code -> (model, tokenizer)
        self._cache: OrderedDict[str, Tuple[object, object]] = OrderedDict()
        self._lock = threading.Lock()

    def cached_languages(self) -> Set[str]:
        with self._lock:
            return set(self._cache.keys())

    def _load_model_for_lang(self, lang: str) -> Tuple[object, object]:
        model_id = MMS_MODEL_MAP.get(lang, MMS_MODEL_MAP["en"])
        from transformers import VitsModel, AutoTokenizer  # type: ignore

        logger.info("[TTSManager] Loading MMS-TTS model for '%s' (%s)...", lang, model_id)
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = VitsModel.from_pretrained(model_id)
        model.eval()
        logger.info("[TTSManager] Loaded MMS-TTS model for '%s'.", lang)
        return model, tokenizer

    def get_tts(self, lang: str) -> Tuple[object, object]:
        """
        Get (model, tokenizer) for the requested language.
        Moves language to end of LRU cache or loads it if not present.
        If cache size exceeds max_models, evicts least recently used model.
        """
        with self._lock:
            if lang in self._cache:
                self._cache.move_to_end(lang)
                return self._cache[lang]

            # If cache is full, evict LRU model
            if len(self._cache) >= self.max_models:
                evicted_lang, (evicted_model, _) = self._cache.popitem(last=False)
                logger.info("[TTSManager] Evicting TTS model for '%s' to free RAM.", evicted_lang)
                del evicted_model

            # Load new model
            model_tuple = self._load_model_for_lang(lang)
            self._cache[lang] = model_tuple
            return model_tuple

    def synthesize(self, text: str, lang: str = "en") -> bytes:
        """
        Convert text into speech WAV bytes.
        """
        if not text or not text.strip():
            raise ValueError("text must not be empty")

        import torch  # type: ignore

        model, tokenizer = self.get_tts(lang)

        inputs = tokenizer(text, return_tensors="pt")
        with torch.no_grad():
            output = model(**inputs)

        waveform = output.waveform.squeeze().numpy()
        sample_rate = model.config.sampling_rate
        return numpy_to_wav(waveform, sample_rate)

    def unload_all(self) -> None:
        """Clear all cached models from RAM."""
        with self._lock:
            self._cache.clear()
            logger.info("[TTSManager] All cached TTS models unloaded.")


def get_tts_manager() -> TTSManager:
    global _tts_manager_instance
    if _tts_manager_instance is not None:
        return _tts_manager_instance

    with _tts_lock:
        if _tts_manager_instance is None:
            _tts_manager_instance = TTSManager()

    return _tts_manager_instance
