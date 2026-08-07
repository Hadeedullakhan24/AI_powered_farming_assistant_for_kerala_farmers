"""
backend/assistant/chat/rag.py
──────────────────────────────
FAISS RAG retriever singleton for HexaKrishi AI Assistant.

Loads vector index lazily and provides search capabilities.
"""

from __future__ import annotations

import logging
import os
import threading
from typing import Optional, List, Tuple, Dict, Any

logger = logging.getLogger("hexakrishi.assistant.rag")

_retriever_instance: Optional["RAGRetriever"] = None
_retriever_lock = threading.Lock()


class RAGRetriever:
    """
    RAG Retriever wrapping FAISS vector store.
    """

    def __init__(self) -> None:
        self.chatbot = None
        self._loaded = False
        self._init_chatbot()

    def _init_chatbot(self) -> None:
        try:
            from backend.models.chatbot.chatbot import FarmingChatbot
            self.chatbot = FarmingChatbot()
            self._loaded = True
            logger.info("[RAGRetriever] FarmingChatbot initialized successfully.")
        except Exception as exc:
            logger.warning("[RAGRetriever] Could not load FAISS chatbot: %s", exc)
            self.chatbot = None
            self._loaded = False

    def is_available(self) -> bool:
        return self._loaded and self.chatbot is not None

    def retrieve(self, query: str, top_k: int = 4) -> Tuple[Optional[str], List[Dict[str, Any]], float]:
        """
        Retrieve relevant context and sources for a user query.

        Returns:
            Tuple of (context_text, sources_list, best_similarity_score).
            If no good context or unavailable, returns (None, [], 0.0).
        """
        if not self.is_available():
            return None, [], 0.0

        try:
            # Call chatbot's internal vector store similarity search
            vector_db = self.chatbot.vector_db
            if not vector_db:
                return None, [], 0.0

            results = self.chatbot.vector_store.similarity_search_with_score(
                vector_db, query, k=top_k
            )

            if not results:
                return None, [], 0.0

            # Inspect best score (lower L2 distance in FAISS = better match)
            # Typically distance < 1.2 or similarity > threshold means good match
            docs = []
            sources = []
            best_score = float("inf")

            for doc, score in results:
                if score < best_score:
                    best_score = score
                docs.append(doc.page_content)
                meta = doc.metadata or {}
                sources.append({
                    "source": meta.get("source", "Knowledge Base"),
                    "page": meta.get("page", 1),
                    "category": meta.get("category", "General")
                })

            context = "\n---\n".join(docs)
            return context, sources, best_score

        except Exception as exc:
            logger.error("[RAGRetriever] Search failed: %s", exc)
            return None, [], 0.0

    def ask_rag_direct(self, query: str) -> dict:
        """
        Compatibility method to call chatbot.ask() directly.
        """
        if not self.is_available():
            raise RuntimeError("RAG chatbot is unavailable.")
        return self.chatbot.ask(query)


def get_rag_retriever() -> Optional[RAGRetriever]:
    """Return RAGRetriever singleton."""
    global _retriever_instance
    if _retriever_instance is not None:
        return _retriever_instance

    with _retriever_lock:
        if _retriever_instance is None:
            _retriever_instance = RAGRetriever()

    return _retriever_instance
