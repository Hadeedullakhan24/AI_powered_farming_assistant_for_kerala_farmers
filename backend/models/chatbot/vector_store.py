"""
vector_store.py

Handles all FAISS vector database operations.
"""

import os

from langchain_community.vectorstores import FAISS

from backend.models.chatbot.embeddings import get_embeddings


class VectorStore:

    def __init__(self):

        self.embeddings = get_embeddings()

    def create(self, documents):
        """
        Create a FAISS vector database from documents.
        """

        return FAISS.from_documents(
            documents,
            self.embeddings
        )

    def save(self, vector_db, save_path):
        """
        Save FAISS index to disk.
        """

        os.makedirs(save_path, exist_ok=True)

        vector_db.save_local(save_path)

        print(f"[INFO] Vector store saved at: {save_path}")

    def load(self, save_path):
        """
        Load an existing FAISS vector database.
        """

        return FAISS.load_local(
            save_path,
            self.embeddings,
            allow_dangerous_deserialization=True
        )

    def similarity_search(
        self,
        vector_db,
        query,
        k=4
    ):
        """
        Retrieve top-k similar chunks.
        """

        return vector_db.similarity_search(
            query,
            k=k
        )
        
    def similarity_search_with_score(
        self,
        vector_db,
        query,
        k=4
    ):
        """
        Retrieve top-k similar chunks along with similarity scores.
        """

        return vector_db.similarity_search_with_score(
            query=query,
            k=k
        )

    def max_marginal_relevance_search(
        self,
        vector_db,
        query,
        k=4,
        fetch_k=10
    ):
        """
        Retrieve diverse but relevant documents using
        Max Marginal Relevance (MMR).
        """

        return vector_db.max_marginal_relevance_search(
            query=query,
            k=k,
            fetch_k=fetch_k
        )