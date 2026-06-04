# Enterprise In-Memory RAG Chatbot

An engineering showcase of a production-ready **Retrieval-Augmented Generation (RAG)** chatbot web application This application processes uploaded PDF documents, chunks and indexes them locally, and exposes a high-fidelity conversational agent capable of retrieving semantic sources with page citations.

![Chat UI](public/screenshot.png)

## System Architecture

The project is structured as a unified Next.js + Python serverless monorepo designed for high-performance deployment to **Vercel Functions** with zero complex CORS configuration or routing layers.

```
┌─────────────────┐             ┌─────────────────┐             ┌─────────────────────┐
│                 │  HTTP POST  │ Vercel Serverless│  REST API   │                     │
│  Client Browser ├────────────►│ Python Function ├────────────►│  Google GenAI API   │
│ (Next.js App)   │             │   (/api/*.py)   │             │ (gemini-1.5-flash)  │
│                 │◄────────────┤                 │◄────────────┤                     │
└────────┬────────┘  JSON Resp  └────────┬────────┘  JSON Resp  └─────────────────────┘
         │                               │
         │ (Next.js Client Router)       │ (In-Memory FAISS Index Store)
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│                 │             │                 │
│   Next.js SSR   │             │  sessions: dict │
│   (Vercel Edge) │             │  { session_id } │
│                 │             │                 │
└─────────────────┘             └─────────────────┘
```

---

## Technical Stack

| Layer | Component | Technology / Model |
| :--- | :--- | :--- |
| **Frontend** | Application Shell | Next.js 14 (App Router, React 18, TypeScript) |
| **Styling** | UI Components | Vanilla Tailwind CSS (IBM Plex Mono + IBM Plex Sans fonts) |
| **Markdown** | Text Renderer | `react-markdown` |
| **Backend** | Serverless Runtime | Vercel Python Runtime 3.11 (BaseHTTPRequestHandler) |
| **Parsing** | PDF Engine | PyMuPDF (`fitz`) |
| **Orchestration**| RAG Framework | LangChain (`RecursiveCharacterTextSplitter`, `ChatGoogleGenerativeAI`) |
| **Embeddings** | Semantic Vector Space| Google `models/embedding-001` (768-dimensional) |
| **Vector Store** | In-Memory Database | FAISS (Facebook AI Similarity Search - CPU edition) |

---

## Production Design Decisions & Architectural Trade-offs

### Session Persistence: In-Memory FAISS vs. Redis Vector Store
To optimize latency and eliminate database hosting costs during hiring manager reviews, this prototype keeps session indexes stored inside a module-level Python dictionary (`sessions: dict[str, FAISS]`).

> [!WARNING]
> **Serverless Statelessness Limitation:** Because Vercel Serverless Functions are stateless, any instance cold-starts will erase the active in-memory sessions dictionary. For a demonstration/interview portfolio, this is completely acceptable.
> 
> **Enterprise Upgrade Path:** In a real production deployment, this system would transition to:
> 1. Storing raw document texts or chunks in an object storage container (AWS S3 / Google Cloud Storage).
> 2. Indexing and searching embeddings via a persistent distributed vector store like **Pinecone**, **Milvus**, or a managed **Redis Stack** instance.
> 3. Tracking session state metadata (e.g. active document, chat history limiters) in a distributed cache like **Upstash Redis**.

---

## Local Development Setup

### Prerequisites
1. **Node.js** (v18+)
2. **Python** (v3.11+)
3. **Vercel CLI** (install globally via `npm i -g vercel`)
4. A **Google Gemini API Key** (set as `GOOGLE_API_KEY`)

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   git clone <repository_url>
   cd RAG-ChatBot
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Create your local environment configuration file:
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and add your valid `GOOGLE_API_KEY`.

4. Start the local serverless development server using the Vercel CLI:
   ```bash
   vercel dev
   ```
   This will spin up both the Next.js frontend app and the Python serverless backend functions on the same port (usually `http://localhost:3000`).

---

## Vercel Deployment

1. **Deploy via CLI:**
   ```bash
   vercel
   ```
   Follow the interactive prompts to link the project.

2. **Configure Environment Variables:**
   Add your `GOOGLE_API_KEY` under project settings → Environment Variables in your Vercel dashboard.

3. **Deploy to Production:**
   ```bash
   vercel --prod
   ```
