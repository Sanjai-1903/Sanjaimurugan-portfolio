"""
Flask backend for the RAG chatbot — serves the portfolio website
and provides a /chat API endpoint powered by Retrieval-Augmented Generation.

Usage:
    export OPENROUTER_API_KEY="your-key-here"
    python backend.py

This single-file backend serves index.html and all static assets
from the project root, so it works both locally and when deployed.
"""

import os
from flask import Flask, send_file, request, jsonify, send_from_directory

# Add rag directory to path so imports work when run from project root
import sys
rag_dir = os.path.dirname(os.path.abspath(__file__))
if rag_dir not in sys.path:
    sys.path.insert(0, rag_dir)

from app import RagChatbot

# Project root is portfolio/ directory (parent of rag/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__)


@app.route("/")
def index():
    return send_file(os.path.join(PROJECT_ROOT, "index.html"))


@app.route("/<path:filename>")
def serve_static(filename):
    """Serve any static file (CSS, JS, images, certificates) from project root."""
    return send_from_directory(PROJECT_ROOT, filename)


# Initialize chatbot lazily so the vector store loads on first request
_chatbot = None


def get_chatbot():
    global _chatbot
    if _chatbot is None:
        api_key = os.environ.get("OPENROUTER_API_KEY", "")
        _chatbot = RagChatbot(api_key=api_key)
    return _chatbot


@app.route("/chat", methods=["POST"])
def chat_endpoint():
    data = request.get_json(force=True)
    query = data.get("query", "").strip()
    if not query:
        return jsonify({"error": "No query provided"}), 400

    bot = get_chatbot()
    response = bot.chat(query)
    return jsonify({"response": response})


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_DEBUG", "true").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug)