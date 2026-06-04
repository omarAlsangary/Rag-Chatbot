"use client";

import React, { useState, useEffect, useRef, FormEvent } from "react";
import { Message, Source } from "../lib/types";
import { sendMessage } from "../lib/api";
import MessageBubble from "./MessageBubble";

interface ChatWindowProps {
  sessionId: string;
  pageCount: number;
  chunkCount: number;
  filename: string;
  onReset: () => void;
}

interface ChatMessage extends Message {
  sources?: Source[];
}

export default function ChatWindow({
  sessionId,
  pageCount,
  chunkCount,
  filename,
  onReset,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom on new messages or typing state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userQuestion = input.trim();
    setInput("");
    setErrorMsg(null);

    // Append User message to UI
    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userQuestion },
    ];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      // Send message to backend
      // Vercel serverless requires the history formatted as [{"role": "user"|"assistant", "content": "..."}]
      // We map our ChatMessages to the required base Message shape
      const historyPayload: Message[] = updatedMessages.slice(0, -1).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await sendMessage(sessionId, userQuestion, historyPayload);

      // Append Assistant response to UI
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.answer,
          sources: response.sources,
        },
      ]);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to communicate with RAG agent.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto border border-[#2a2a2a] bg-[#0c0c0c] rounded-md overflow-hidden shadow-2xl">
      {/* Chrome Terminal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a2a] bg-[#141414] font-mono text-xs">
        <div className="flex items-center space-x-2 text-zinc-400">
          <span className="text-emerald-400 animate-pulse">●</span>
          <span className="text-zinc-200 truncate max-w-xs md:max-w-md">{filename}</span>
          <span className="text-zinc-600">|</span>
          <span className="text-emerald-400 font-semibold">✓ {pageCount} pages</span>
          <span className="text-zinc-600">·</span>
          <span className="text-emerald-400 font-semibold">{chunkCount} chunks indexed</span>
        </div>
        <button
          onClick={onReset}
          className="text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
        >
          [ RESET ]
        </button>
      </div>

      {/* Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 font-mono text-zinc-500">
            <span className="text-2xl text-emerald-400 animate-pulse">[ &gt;_ ]</span>
            <p className="text-xs uppercase tracking-widest">Session initialized. Awaiting queries.</p>
            <p className="text-[11px] text-zinc-600 max-w-sm">
              Ask consulting-specific questions, run financials, or extract key action items.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble
              key={index}
              role={msg.role}
              content={msg.content}
              sources={msg.sources}
            />
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start items-end space-x-2 animate-fade-in">
            <div className="px-4 py-3 bg-[#141414] border border-[#2a2a2a] rounded-md text-zinc-400 font-mono text-xs flex items-center space-x-2">
              <span className="animate-pulse">Consulting AI is analyzing</span>
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </span>
            </div>
          </div>
        )}

        {/* Inline Error Toast */}
        {errorMsg && (
          <div className="p-4 border border-red-950 bg-red-950/10 rounded-md flex justify-between items-center text-red-400 font-mono text-xs animate-fade-in">
            <span>[ERROR] {errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-500 hover:text-red-300 font-bold ml-4"
            >
              ×
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Bottom Form Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-[#2a2a2a] bg-[#141414]"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a consulting question (e.g., 'What are the main risks identified?')"
            disabled={isTyping}
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md py-3 pl-4 pr-24 font-sans text-sm text-zinc-100 placeholder-zinc-600 transition-all duration-200 focus:border-emerald-400/80 focus:ring-1 focus:ring-emerald-400/30 focus:outline-none focus:shadow-[0_0_12px_rgba(110,231,183,0.15)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="absolute right-2 font-mono text-xs uppercase tracking-widest px-4 py-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 rounded-md hover:bg-emerald-500/20 active:bg-emerald-500/30 transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none"
          >
            SEND
          </button>
        </div>
      </form>
    </div>
  );
}
