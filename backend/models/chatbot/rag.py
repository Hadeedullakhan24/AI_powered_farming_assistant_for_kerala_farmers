"""
rag.py

Builds the FAISS vector database from the knowledge base.
"""

import os
import fitz

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from models.chatbot.vector_store import VectorStore


class RAGBuilder:

    def __init__(self):

        self.vector_store = VectorStore()

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )

    def load_documents(self, knowledge_base_path):

        documents = []

        print("\n[INFO] Reading PDFs...\n")

        for root, _, files in os.walk(knowledge_base_path):

            for file in files:

                if not file.lower().endswith(".pdf"):
                    continue

                pdf_path = os.path.join(root, file)

                print(f"[INFO] Reading: {pdf_path}")

                pdf = fitz.open(pdf_path)

                category = os.path.basename(root)

                for page_number in range(len(pdf)):

                    page = pdf.load_page(page_number)

                    text = page.get_text()

                    if not text.strip():
                        continue

                    metadata = {
                        "source": file,
                        "page": page_number + 1,
                        "category": category
                    }

                    documents.append(
                        Document(
                            page_content=text,
                            metadata=metadata
                        )
                    )

                pdf.close()

        print(f"\n[INFO] Loaded {len(documents)} pages.\n")

        return documents
    
    def split_documents(self, documents):
        """
        Split documents into smaller chunks.
        """

        print("[INFO] Splitting documents into chunks...")

        chunks = self.text_splitter.split_documents(documents)

        print(f"[INFO] Generated {len(chunks)} chunks.\n")

        return chunks

    def build_vector_store(self, chunks):
        """
        Build FAISS vector database.
        """

        print("[INFO] Creating FAISS vector store...")

        vector_db = self.vector_store.create(chunks)

        print("[INFO] FAISS vector store created.\n")

        return vector_db
    
    def save_vector_store(self, vector_db, save_path):
        """
        Save FAISS vector database.
        """

        self.vector_store.save(vector_db, save_path)
        
    def build(self, knowledge_base_path, save_path):
        """
        Complete RAG build pipeline.
        """

        documents = self.load_documents(knowledge_base_path)

        chunks = self.split_documents(documents)

        vector_db = self.build_vector_store(chunks)

        self.save_vector_store(vector_db, save_path)

        print("\n===================================")
        print(" Knowledge Base Built Successfully ")
        
        print("===================================\n")   
        
         
if __name__ == "__main__":

    builder = RAGBuilder()

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

    KNOWLEDGE_BASE = os.path.join(BASE_DIR, "knowledge_base")

    INDEX_PATH = os.path.join(
        KNOWLEDGE_BASE,
        "index"
    )

    builder.build(
        KNOWLEDGE_BASE,
        INDEX_PATH
    )