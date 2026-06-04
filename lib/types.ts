export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface UploadResponse {
  session_id: string;
  page_count: number;
  chunk_count: number;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
}

export interface Source {
  page: number;
  snippet: string;
}
