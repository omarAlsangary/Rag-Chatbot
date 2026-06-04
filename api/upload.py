import json
import re
import sys
import os
from http.server import BaseHTTPRequestHandler

# Add parent directory to path so we can import lib.rag
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from lib.rag import ingest_pdf

def parse_multipart(body: bytes, boundary: str) -> dict[str, tuple[str, bytes]]:
    """
    Manually parses multipart/form-data bytes without external libraries.
    Returns a dict mapping field names to (filename, data) tuples.
    """
    boundary_bytes = boundary.encode("utf-8")
    parts = body.split(b"--" + boundary_bytes)
    result = {}
    
    for part in parts:
        # Strip leading CRLF or LF resulting from split
        if part.startswith(b"\r\n"):
            part = part[2:]
        elif part.startswith(b"\n"):
            part = part[1:]
            
        # Skip empty parts or the final closing boundary part
        if not part or part.startswith(b"--"):
            continue
            
        # Headers are separated from data by double CRLF or LF
        if b"\r\n\r\n" in part:
            header_part, file_data = part.split(b"\r\n\r\n", 1)
        elif b"\n\n" in part:
            header_part, file_data = part.split(b"\n\n", 1)
        else:
            continue
            
        # Remove trailing CRLF or LF from the file data
        if file_data.endswith(b"\r\n"):
            file_data = file_data[:-2]
        elif file_data.endswith(b"\n"):
            file_data = file_data[:-1]
            
        header_str = header_part.decode("utf-8", errors="ignore")
        name_match = re.search(r'name="([^"]+)"', header_str)
        filename_match = re.search(r'filename="([^"]+)"', header_str)
        
        if name_match:
            name = name_match.group(1)
            filename = filename_match.group(1) if filename_match else ""
            result[name] = (filename, file_data)
            
    return result

class handler(BaseHTTPRequestHandler):
    def do_POST(self) -> None:
        try:
            content_type = self.headers.get("content-type", "")
            if "multipart/form-data" not in content_type:
                self.send_error_response(400, "Content-Type must be multipart/form-data")
                return

            # Extract boundary
            boundary = ""
            for param in content_type.split(";"):
                if "boundary=" in param:
                    boundary = param.split("boundary=")[1].strip('"')
            
            if not boundary:
                self.send_error_response(400, "Multipart boundary not found in Content-Type header")
                return

            # Read post body
            content_length = int(self.headers.get("content-length", 0))
            if content_length == 0:
                self.send_error_response(400, "Content-Length must be specified and non-zero")
                return

            body = self.rfile.read(content_length)
            form_data = parse_multipart(body, boundary)
            
            # Find file field (usually named "file")
            file_field = form_data.get("file")
            if not file_field:
                self.send_error_response(400, "No file field uploaded under key 'file'")
                return
                
            filename, file_bytes = file_field
            
            # Validate PDF extension and file signature
            if not filename.lower().endswith(".pdf"):
                self.send_error_response(400, "Invalid file format. Only PDF files are allowed.")
                return
                
            if not file_bytes.startswith(b"%PDF"):
                self.send_error_response(400, "Uploaded file does not appear to be a valid PDF.")
                return

            # Process RAG ingestion
            session_id, page_count, chunk_count = ingest_pdf(file_bytes)
            
            # Respond with success details
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            
            response_body = {
                "session_id": session_id,
                "page_count": page_count,
                "chunk_count": chunk_count
            }
            self.wfile.write(json.dumps(response_body).encode("utf-8"))
            
        except Exception as e:
            # Catch all server errors (e.g. Gemini/FAISS failures)
            self.send_error_response(500, f"Failed to parse and index PDF: {str(e)}")

    def send_error_response(self, code: int, message: str) -> None:
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode("utf-8"))
