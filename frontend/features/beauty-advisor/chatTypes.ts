export interface RecommendedProduct {
  id: string;
  nama_produk: string;
  brand?: string | null;
  category?: string | null;
  harga: number;
  rating: number;
  foto_utama?: string | null;
  stok: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  recommended_products?: RecommendedProduct[];
  suggested_followups?: string[];
}

export interface ChatMessageRequest {
  message: string;
  conversation_id?: string | null;
}

export interface ChatResponse {
  conversation_id: string;
  message_id: string;
  reply: string;
  recommended_products: RecommendedProduct[];
  suggested_followups: string[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  last_message?: string | null;
  created_at: string;
}

export interface MessageHistoryItem {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  created_at: string;
  messages: MessageHistoryItem[];
}
