import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

# Add parent directory to path so we can import api.* files and lib.rag
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from api.upload import handler as UploadHandler
from api.chat import handler as ChatHandler
from api.health import handler as HealthHandler

class DevRouterHandler(BaseHTTPRequestHandler):
    def send_error_response(self, code: int, message: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode("utf-8"))

    def do_GET(self):
        if self.path == "/api/health":
            # Call method directly on the current request instance
            HealthHandler.do_GET(self)
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")

    def do_POST(self):
        if self.path == "/api/upload":
            # Call method directly on the current request instance
            UploadHandler.do_POST(self)
        elif self.path == "/api/chat":
            # Call method directly on the current request instance
            ChatHandler.do_POST(self)
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")

def run(server_class=HTTPServer, handler_class=DevRouterHandler, port=5328):
    server_address = ("127.0.0.1", port)
    httpd = server_class(server_address, handler_class)
    print(f"Local Python Backend Server running on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping backend server...")
    finally:
        httpd.server_close()

if __name__ == "__main__":
    run()
