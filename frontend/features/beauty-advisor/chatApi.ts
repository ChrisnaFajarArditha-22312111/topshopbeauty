import api from "@/lib/axios";
import {
  ChatMessageRequest,
  ChatResponse,
  ConversationSummary,
  ConversationDetail,
} from "./chatTypes";

export const chatApi = {
  sendMessage: async (data: ChatMessageRequest): Promise<ChatResponse> => {
    let guestToken: string | null = null;
    if (typeof window !== "undefined" && data.conversation_id) {
      try {
        guestToken = sessionStorage.getItem(`beauty_guest_token:${data.conversation_id}`);
      } catch {
        // Server tetap menolak kelanjutan sesi tanpa token yang valid.
      }
    }
    const res = await api.post<ChatResponse>("/beauty-advisor/chat", data, {
      headers: guestToken ? { "X-Guest-Token": guestToken } : undefined,
    });
    if (typeof window !== "undefined" && res.data.guest_token) {
      try {
        sessionStorage.setItem(`beauty_guest_token:${res.data.conversation_id}`, res.data.guest_token);
      } catch {
        // Penyimpanan browser dapat dinonaktifkan oleh pengguna.
      }
    }
    return res.data;
  },

  getConversations: async (): Promise<ConversationSummary[]> => {
    const res = await api.get<ConversationSummary[]>("/beauty-advisor/conversations");
    return res.data;
  },

  getConversationDetail: async (conversationId: string): Promise<ConversationDetail> => {
    const res = await api.get<ConversationDetail>(`/beauty-advisor/conversations/${conversationId}`);
    return res.data;
  },

  deleteConversation: async (conversationId: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/beauty-advisor/conversations/${conversationId}`);
    return res.data;
  },
};
