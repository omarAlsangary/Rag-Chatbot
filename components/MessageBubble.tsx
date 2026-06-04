"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Source } from "../lib/types";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function MessageBubble({ role, content, sources }: MessageBubbleProps) {
  const isUser = role === "user";
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-md border p-5 space-y-3 ${
          isUser
            ? "bg-[#141414] border-[#2a2a2a] text-zinc-100"
            : "bg-[#161616] border-[#252525] text-zinc-100"
        }`}
      >
        {/* Role badge */}
        <div className="font-mono text-[10px] tracking-widest text-zinc-500 uppercase select-none">
          {isUser ? "USER_PROMPT" : "CONSULTING_AI_REP"}
        </div>

        {/* Message Content */}
        <div className="font-sans text-sm leading-relaxed prose prose-invert max-w-none text-zinc-200">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-zinc-300">{children}</li>,
              strong: ({ children }) => <strong className="text-emerald-300 font-semibold">{children}</strong>,
              code: ({ children }) => (
                <code className="bg-[#0a0a0a] border border-[#2a2a2a] px-1 py-0.5 rounded font-mono text-xs text-emerald-400">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-[#0a0a0a] border border-[#2a2a2a] p-3 rounded font-mono text-xs text-zinc-300 overflow-x-auto my-3">
                  {children}
                </pre>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Collapsible Sources Section */}
        {!isUser && sources && sources.length > 0 && (
          <div className="pt-3 border-t border-[#222222]">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center space-x-1.5 font-mono text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors uppercase tracking-wider"
            >
              <span>{showSources ? "[-]" : "[+]"}</span>
              <span>Sources ({sources.length})</span>
            </button>

            {showSources && (
              <div className="mt-3 space-y-2 animate-slide-down">
                {sources.map((src, i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded-md font-mono text-xs"
                  >
                    <div className="text-emerald-400 font-semibold mb-1">
                      PAGE_{String(src.page).padStart(3, "0")}
                    </div>
                    <div className="text-zinc-400 text-[11px] leading-normal leading-relaxed italic">
                      &quot;{src.snippet}&quot;
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
