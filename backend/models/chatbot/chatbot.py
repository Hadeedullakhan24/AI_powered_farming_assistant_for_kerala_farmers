"""
chatbot.py

Production-ready RAG Chatbot using
FAISS + Groq + Conversation Memory
"""

import os

from dotenv import load_dotenv
from pathlib import Path

# backend/models/chatbot/chatbot.py
BACKEND_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BACKEND_DIR / ".env"

print("Loading .env from:", ENV_FILE)

load_dotenv(dotenv_path=ENV_FILE)

print("GROQ_API_KEY:", os.getenv("GROQ_API_KEY"))

from langchain_groq import ChatGroq

from backend.models.chatbot.vector_store import VectorStore
from backend.models.chatbot.prompts import RAG_PROMPT
from backend.models.chatbot.memory import ConversationMemory


class FarmingChatbot:

    def __init__(self):

        print("[INFO] Initializing Farming Chatbot...")

        self.vector_store = VectorStore()

        self.memory = ConversationMemory(
            max_history=10
        )

        base_dir = os.path.dirname(
            os.path.abspath(__file__)
        )

        index_path = os.path.join(
            base_dir,
            "knowledge_base",
            "index"
        )

        print("[INFO] Loading FAISS index...")

        self.db = self.vector_store.load(index_path)

        print("[INFO] FAISS loaded successfully.")

        print("[INFO] Loading Groq model...")

        self.llm = ChatGroq(
            groq_api_key=os.getenv("GROQ_API_KEY"),
            model="llama-3.3-70b-versatile",
            temperature=0
        )

        print("[INFO] Chatbot Ready.\n")
        
    def validate_question(self, question):
        """
        Validate user input.
        """

        if not question:
            raise ValueError("Question cannot be empty.")

        question = question.strip()

        if len(question) == 0:
            raise ValueError("Question cannot be empty.")

        return question


    def retrieve_documents(self, question):

        return self.vector_store.similarity_search_with_score(
            self.db,
            question,
            k=4
        )

        


    def build_context(self, retrieved_docs):

        context = []
        sources = []

        for doc, score in retrieved_docs:

            context.append(doc.page_content)

            sources.append(
                {
                    "source": doc.metadata.get("source", "Unknown"),
                    "page": doc.metadata.get("page", "-"),
                    "category": doc.metadata.get("category", "Unknown"),
                    "score": round(float(score), 4)
                }
            )

        return "\n\n".join(context), sources

    def build_prompt(self, question, context):
        """
        Build the prompt using history + retrieved context.
        """

        history = self.memory.get_formatted_history()

        prompt = RAG_PROMPT.invoke(
            {
                "history": history,
                "context": context,
                "question": question,
            }
        )

        return prompt


    def generate_response(self, prompt):
        """
        Generate response using Groq.
        """

        response = self.llm.invoke(prompt)

        return response.content


    def update_memory(self, question, answer):
        """
        Store conversation.
        """

        self.memory.add_user_message(question)

        self.memory.add_ai_message(answer)


    def clear_memory(self):
        """
        Clear conversation history.
        """

        self.memory.clear()


    def ask(self, question):
        """
        Complete RAG pipeline.
        """

        question = self.validate_question(question)

        retrieved_docs = self.retrieve_documents(question)

        # Keep only good matches
        retrieved_docs = [
            (doc, score)
            for doc, score in retrieved_docs
            if score >= 0.45
        ]

        if len(retrieved_docs) == 0:

            return {
                "answer": "I couldn't find this information in the agricultural knowledge base.",
                "sources": []
            }

        context, sources = self.build_context(
            retrieved_docs
        )

        prompt = self.build_prompt(
            question,
            context
        )

        answer = self.generate_response(
            prompt
        )

        self.update_memory(
            question,
            answer
        )

        return{
            "answer": answer,
            "sources": sources
        }
        
        
if __name__ == "__main__":

    chatbot = FarmingChatbot()

    print("=" * 60)
    print("AI Farming Assistant")
    print("Type 'exit' to quit.")
    print("Type 'clear' to clear conversation.")
    print("=" * 60)

    while True:

        question = input("\nYou: ")

        if question.lower() in ["exit", "quit"]:
            break

        if question.lower() == "clear":

            chatbot.clear_memory()

            print("\nConversation cleared.")

            continue

        try:

            result = chatbot.ask(question)

            print("\nAssistant:\n")

            print(result["answer"])

            print("\nSources:")

            for source in result["sources"]:

                print(
                    f"- {source['source']} "
                    f"(Page {source['page']}) "
                    f"[{source['category']}]"
                )

        except Exception as e:

            print(f"\nError: {e}")