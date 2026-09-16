import api from "@/lib/axios";
import {
  ChatMessageRequest,
  ChatResponse,
  ConversationSummary,
  ConversationDetail,
} from "./chatTypes";

export const chatApi = {
  sendMessage: async (data: ChatMessageRequest): Promise<ChatResponse> => {
    const res = await api.post<ChatResponse>("/beauty-advisor/chat", data);
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
