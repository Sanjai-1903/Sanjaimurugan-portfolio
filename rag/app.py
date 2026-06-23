import os
from document import search


class RagChatbot:
    """RAG-powered chatbot for the portfolio website."""

    def __init__(self, api_key=None, model="meta-llama/llama-3.1-70b-instruct"):
        self.api_key = api_key or os.environ.get("OPENROUTER_API_KEY", "")
        self.model = model
        self.url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "HTTP-Referer": "https://sanjai.dev",
            "X-Title": "Sanjai Portfolio RAG",
            "Content-Type": "application/json",
        }

    def build_prompt(self, query, context):
        return (
            f"You are Sanjai Murugan's AI assistant, answering questions based "
            f"solely on the provided context. Be concise, accurate, and only use "
            f"information from the context. If the answer is not in the context, "
            f"say so honestly.\n\nContext:\n{context}\n\nQuestion: {query}"
        )

    def chat(self, query):
        """Send a query through RAG pipeline: retrieve docs, then LLM generate."""
        if not self.api_key:
            return "⚠️ OpenRouter API key is not configured. Set the OPENROUTER_API_KEY environment variable."

        context = search(query)
        prompt = self.build_prompt(query, context)

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
            "max_tokens": 1024,
        }

        try:
            import requests
            response = requests.post(self.url, headers=self.headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error: {str(e)}"


if __name__ == "__main__":
    import sys
    question = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "What is Sanjai's background?"
    bot = RagChatbot()
    print(bot.chat(question))