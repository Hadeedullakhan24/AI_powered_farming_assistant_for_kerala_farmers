"""
embeddings.py

Loads and returns the embedding model used throughout the RAG pipeline.
"""

import torch
from langchain_huggingface import HuggingFaceEmbeddings

EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

_embeddings = None


def get_embeddings():
    global _embeddings

    if _embeddings is None:
        print(f"[INFO] Loading embedding model on {DEVICE.upper()}...")

        _embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": DEVICE},
            encode_kwargs={"normalize_embeddings": True},
        )

        print("[INFO] Embedding model loaded successfully.")

    return _embeddings


if __name__ == "__main__":
    embeddings = get_embeddings()
    print(type(embeddings))