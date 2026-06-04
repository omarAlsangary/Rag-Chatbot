from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys, os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from lib.rag import ingest_pdf, query

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    session_id: str
    question: str
    history: list

@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    content = await file.read()
    session_id, page_count, chunk_count = ingest_pdf(content)
    return {"session_id": session_id, "page_count": page_count, "chunk_count": chunk_count}

@app.post("/api/chat")
async def chat(req: ChatRequest):
    try:
        answer, sources = query(req.session_id, req.question, req.history)
        return {"answer": answer, "sources": sources}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/health")
async def health():
    return {"status": "ok"}