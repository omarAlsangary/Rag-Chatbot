import io
import uuid
import fitz  # PyMuPDF
from dotenv import load_dotenv
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

import os
# Load environment variables (e.g. GOOGLE_API_KEY)
load_dotenv()
# Also load .env.local if present for local development
if os.path.exists(".env.local"):
    load_dotenv(dotenv_path=".env.local")

# In-memory session store (wiped on serverless cold starts)
sessions: dict[str, FAISS] = {}

def ingest_pdf(file_bytes: bytes) -> tuple[str, int, int]:
    """
    Parses PDF bytes, splits text into chunks, computes embeddings,
    stores in a FAISS index, and registers it to a new session ID.
    
    Returns:
        tuple[str, int, int]: (session_id, page_count, chunk_count)
    """
    # Parse PDF using PyMuPDF (fitz)
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    page_count = len(doc)
    
    documents: list[Document] = []
    for page_num in range(page_count):
        page = doc.load_page(page_num)
        text = page.get_text()
        # Pages are 1-indexed for human-friendly reference
        documents.append(Document(page_content=text, metadata={"page": page_num + 1}))
    
    # Split text into chunks
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(documents)
    chunk_count = len(chunks)
    
    # If no text was extracted (e.g., scanned PDF with no OCR), handle gracefully
    if not chunks:
        # Create a single placeholder document to avoid FAISS initialization error
        chunks = [Document(page_content="No extractable text found in document.", metadata={"page": 1})]
        chunk_count = 0

    # Compute embeddings and store in FAISS index
    embeddings = GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001")
    db = FAISS.from_documents(chunks, embeddings)
    
    # Store session
    session_id = str(uuid.uuid4())
    sessions[session_id] = db
    
    return session_id, page_count, chunk_count

def query(session_id: str, question: str, history: list[dict]) -> tuple[str, list[dict]]:
    """
    Retrieves relevant chunks from the FAISS store by session_id,
    constructs the conversation context, and calls Gemini 1.5 Flash.
    
    Returns:
        tuple[str, list[dict]]: (answer, sources)
    """
    db = sessions.get(session_id)
    if not db:
        raise ValueError("Session not found or has expired due to inactivity.")
    
    # Retrieve top 4 most relevant chunks
    retrieved_docs = db.similarity_search(question, k=4)
    
    # Construct context block
    context_parts = []
    for doc in retrieved_docs:
        page = doc.metadata.get("page", 1)
        context_parts.append(f"--- Page {page} ---\n{doc.page_content}")
    context_str = "\n\n".join(context_parts)
    
    # Build System message instructing the agent
    system_prompt = (
        "You are an elite AI Consulting Assistant (BCG X style). "
        "Use the retrieved document context below to answer the user's question. "
        "Keep your response highly structured, precise, and professional. "
        "Ensure you address the query directly. If the information is not present in "
        "the context, state that you cannot find the answer in the provided document.\n\n"
        f"Retrieved Document Context:\n{context_str}"
    )
    
    # Compile messages (System + History + Current Question)
    messages = [SystemMessage(content=system_prompt)]
    
    for msg in history:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "user":
            messages.append(HumanMessage(content=content))
        elif role == "assistant":
            messages.append(AIMessage(content=content))
            
    messages.append(HumanMessage(content=question))
    
    # Call Gemini model
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    response = llm.invoke(messages)
    answer = str(response.content)
    
    # Format sources for response
    sources = []
    for doc in retrieved_docs:
        snippet = doc.page_content
        # Truncate snippet to 200 chars for clean display if long
        if len(snippet) > 200:
            snippet = snippet[:200].strip() + "..."
        sources.append({
            "page": doc.metadata.get("page", 1),
            "snippet": snippet
        })
        
    return answer, sources
