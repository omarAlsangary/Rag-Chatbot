"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { uploadPDF } from "../lib/api";

interface FileUploadProps {
  onUploadComplete: (
    sessionId: string,
    pageCount: number,
    chunkCount: number,
    filename: string
  ) => void;
}

type UploadStatus = "idle" | "uploading" | "error";

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Validate client-side: PDF only
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus("error");
      setErrorMsg("File must be a PDF document.");
      return;
    }

    setStatus("uploading");
    setErrorMsg(null);

    try {
      const response = await uploadPDF(file);
      onUploadComplete(
        response.session_id,
        response.page_count,
        response.chunk_count,
        file.name
      );
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "An unexpected error occurred during upload.");
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={status === "idle" || status === "error" ? triggerBrowse : undefined}
        className={`border-2 border-dashed rounded-md p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
          isDragOver
            ? "border-emerald-400 bg-emerald-950/10 shadow-[0_0_15px_rgba(110,231,183,0.15)]"
            : status === "error"
            ? "border-red-900 bg-red-950/5 hover:border-red-800"
            : "border-[#2a2a2a] bg-[#141414] hover:border-[#3e3e3e]"
        } ${status === "uploading" ? "pointer-events-none opacity-80" : ""}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />

        {status === "idle" && (
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Terminal upload icon */}
            <div className="text-emerald-400 font-mono text-3xl mb-2 animate-pulse">
              [↑]
            </div>
            <p className="font-mono text-sm tracking-wider uppercase text-zinc-300">
              Drag & Drop PDF or Click to Browse
            </p>
            <p className="font-sans text-xs text-zinc-500">
              Only standard PDF files are supported. Max size 10MB.
            </p>
          </div>
        )}

        {status === "uploading" && (
          <div className="flex flex-col items-center text-center space-y-4 w-full max-w-xs">
            <div className="text-emerald-400 font-mono text-sm animate-pulse mb-2">
              INGESTING_DOCUMENT...
            </div>
            {/* Premium custom loading skeleton/bar */}
            <div className="h-1.5 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 animate-[loading_1.5s_infinite_ease-in-out]"></div>
            </div>
            <p className="font-mono text-xs text-zinc-400">
              Parsing pages & indexing FAISS vector store
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="text-red-500 font-mono text-3xl mb-2">
              [!]
            </div>
            <p className="font-mono text-sm tracking-wider uppercase text-red-400">
              Ingestion Failed
            </p>
            <p className="font-sans text-xs text-zinc-400 max-w-md">
              {errorMsg}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStatus("idle");
                setErrorMsg(null);
              }}
              className="mt-2 font-mono text-xs px-4 py-2 border border-red-900 bg-red-950/20 text-red-400 rounded-md hover:bg-red-950/40 transition"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>

      {/* Tailwind inline animation styling support */}
      <style jsx global>{`
        @keyframes loading {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}
