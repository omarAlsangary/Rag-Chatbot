"use client";

import React, { useState } from "react";
import FileUpload from "../components/FileUpload";
import ChatWindow from "../components/ChatWindow";

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [chunkCount, setChunkCount] = useState(0);
  const [filename, setFilename] = useState("");

  const handleUploadComplete = (
    sid: string,
    pages: number,
    chunks: number,
    fname: string
  ) => {
    setSessionId(sid);
    setPageCount(pages);
    setChunkCount(chunks);
    setFilename(fname);
  };

  const handleReset = () => {
    setSessionId(null);
    setPageCount(0);
    setChunkCount(0);
    setFilename("");
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col justify-between selection:bg-emerald-500/20">
      {/* Top Navigation / Branding */}
      <header className="border-b border-[#1f1f1f] bg-[#0c0c0c] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="font-mono text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Omar Khaled Alsangary
          </div>
        </div>
        <div className="flex items-center space-x-4 font-mono text-[10px] text-zinc-500">
          <span>SECURE_RAG_PIPELINE v1.0.0</span>
          <span>●</span>
          <span>STATUS: OPERATIONAL</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center px-4 py-8">
        {!sessionId ? (
          // Landing Ingestion Screen
          <div className="max-w-3xl mx-auto w-full text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <div className="font-mono text-xs text-emerald-400 tracking-widest uppercase">
                Enterprise Document Intelligence
              </div>
              <h1 className="text-4xl md:text-5xl font-mono tracking-tight font-extrabold text-zinc-100">
                IN-MEMORY RAG AGENT
              </h1>
              <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto font-sans leading-relaxed">
                Upload a corporate deck, PDF brief, or financial statement.
                Ask complex questions, extract figures, or generate consulting summaries instantly.
              </p>
            </div>

            {/* Ingestion Dropzone */}
            <div className="py-4">
              <FileUpload onUploadComplete={handleUploadComplete} />
            </div>

            {/* Capabilities grid for premium consulting aesthetic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto pt-6 text-left font-mono">
              <div className="p-4 border border-[#1f1f1f] bg-[#0c0c0c] rounded-md space-y-1">
                <div className="text-emerald-400 text-xs font-semibold">[01]</div>
                <div className="text-zinc-200 text-xs font-semibold uppercase">EXECUTIVE SUMMARY</div>
                <p className="text-zinc-500 text-[11px] font-sans leading-normal">
                  Synthesize large PDFs into bulleted consulting summaries and takeaways.
                </p>
              </div>
              <div className="p-4 border border-[#1f1f1f] bg-[#0c0c0c] rounded-md space-y-1">
                <div className="text-emerald-400 text-xs font-semibold">[02]</div>
                <div className="text-zinc-200 text-xs font-semibold uppercase">RISK AUDITING</div>
                <p className="text-zinc-500 text-[11px] font-sans leading-normal">
                  Locate key liabilities, operational risk factors, and policy gaps.
                </p>
              </div>
              <div className="p-4 border border-[#1f1f1f] bg-[#0c0c0c] rounded-md space-y-1">
                <div className="text-emerald-400 text-xs font-semibold">[03]</div>
                <div className="text-zinc-200 text-xs font-semibold uppercase">CITATIONS & PROOFS</div>
                <p className="text-zinc-500 text-[11px] font-sans leading-normal">
                  Retrieve response snippets mapped to their original source page numbers.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Active Chat Screen
          <div className="w-full max-w-5xl mx-auto animate-fade-in">
            <ChatWindow
              sessionId={sessionId}
              pageCount={pageCount}
              chunkCount={chunkCount}
              filename={filename}
              onReset={handleReset}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1f1f1f] bg-[#0c0c0c] px-8 py-3 text-center md:flex md:justify-between items-center font-mono text-[10px] text-zinc-600">
        <div>
          &copy; {new Date().getFullYear()}
        </div>
        <div className="mt-2 md:mt-0 flex justify-center space-x-4">
          <span>VECTOR_DB: FAISS (CPU)</span>
          <span>·</span>
          <span>EMBEDDINGS: gemini-embedding-001</span>
          <span>·</span>
          <span>CHAT: gemini-2.5-flash</span>
        </div>
      </footer>
    </main>
  );
}
