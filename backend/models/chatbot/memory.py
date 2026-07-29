"""
memory.py

Handles conversation memory for the chatbot.
"""

from collections import deque


class ConversationMemory:
    """
    Maintains conversation history.

    Stores:
    - User messages
    - Assistant responses

    Keeps only the latest N exchanges.
    """

    def __init__(self, max_history=10):

        self.max_history = max_history

        self.history = deque(maxlen=max_history)

    def add_user_message(self, message):
        """
        Store a user message.
        """

        self.history.append({
            "role": "user",
            "content": message
        })

    def add_ai_message(self, message):
        """
        Store an assistant message.
        """

        self.history.append({
            "role": "assistant",
            "content": message
        })

    def get_history(self):
        """
        Return conversation history.
        """

        return list(self.history)

    def get_formatted_history(self):
        """
        Convert history into prompt format.
        """

        if not self.history:
            return ""

        conversation = []

        for message in self.history:

            if message["role"] == "user":

                conversation.append(
                    f"User: {message['content']}"
                )

            else:

                conversation.append(
                    f"Assistant: {message['content']}"
                )

        return "\n".join(conversation)

    def clear(self):
        """
        Clear all stored history.
        """

        self.history.clear()