import json
import sys
import os
from http.server import BaseHTTPRequestHandler

# Add parent directory to path so we can import lib.rag
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from lib.rag import query

class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        try:
            content_type = self.headers.get("content-type", "")
            if "application/json" not in content_type:
                self.send_error_response(400, "Content-Type must be application/json")
                return

            # Read post body
            content_length = int(self.headers.get("content-length", 0))
            if content_length == 0:
                self.send_error_response(400, "Content-Length must be specified and non-zero")
                return

            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode("utf-8"))
            except json.JSONDecodeError:
                self.send_error_response(400, "Invalid JSON body")
                return

            # Validate fields
            session_id = data.get("session_id")
            question = data.get("question")
            history = data.get("history")

            if not session_id or not isinstance(session_id, str):
                self.send_error_response(400, "Missing or invalid field: 'session_id'")
                return
            if not question or not isinstance(question, str):
                self.send_error_response(400, "Missing or invalid field: 'question'")
                return
            if history is None or not isinstance(history, list):
                self.send_error_response(400, "Missing or invalid field: 'history'")
                return

            # Execute RAG query
            try:
                answer, sources = query(session_id, question, history)
            except ValueError as ve:
                # ValueErrors are raised when the session is not found
                self.send_error_response(404, str(ve))
                return

            # Respond with answer and sources
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            response_body = {
                "answer": answer,
                "sources": sources
            }
            self.wfile.write(json.dumps(response_body).encode("utf-8"))

        except Exception as e:
            # Handle other runtime or connection errors
            self.send_error_response(500, f"Query execution failed: {str(e)}")

    def send_error_response(self, code: int, message: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode("utf-8"))
