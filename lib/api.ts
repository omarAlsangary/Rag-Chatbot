import { Message, UploadResponse, ChatResponse } from "./types";

/**
 * Uploads a PDF file to the backend serverless function for parsing and FAISS ingestion.
 * Throws an Error with the backend's message on non-2xx responses.
 */
export async function uploadPDF(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "Failed to upload and index PDF.";
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData.error === "string") {
        errorMessage = errorData.error;
      }
    } catch {
      // Non-JSON response or JSON parsing failed
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Sends a chat message to the backend RAG pipeline.
 * Throws an Error with the backend's message on non-2xx responses.
 */
export async function sendMessage(
  sessionId: string,
  question: string,
  history: Message[]
): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: sessionId,
      question,
      history,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to get an answer from the chatbot.";
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData.error === "string") {
        errorMessage = errorData.error;
      }
    } catch {
      // Non-JSON response or JSON parsing failed
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
