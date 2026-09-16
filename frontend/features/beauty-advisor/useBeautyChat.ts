"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "./chatApi";
import {
  ChatMessage,
  RecommendedProduct,
  ConversationSummary,
} from "./chatTypes";
import { useAuth } from "@/features/auth/useAuth";
import { toast } from "sonner";

export const INITIAL_AI_WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-message",
  role: "assistant",
  content:
    "Halo Beauty Enthusiast! ✨ Saya adalah **AI Beauty Advisor Topshop Kosmetik**. Ada yang bisa saya bantu terkait jenis kulit, masalah jerawat, kusam, atau rekomendasi produk skincare yang tepat hari ini?",
  created_at: "",
  suggested_followups: [
    "Rekomendasi skincare untuk kulit berjerawat dan sensitif",
    "Serum pencerah untuk bekas jerawat hitam",
    "Sunscreen ringan yang cocok untuk kulit berminyak",
    "Urutan skincare routine pagi untuk pemula",
  ],
};

export const GUEST_QUESTION_LIMIT = 3;

export function useBeautyChat(initialConversationId?: string | null) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [conversationId, setConversationId] = React.useState<string | null>(
    initialConversationId || null
  );
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    INITIAL_AI_WELCOME_MESSAGE,
  ]);
  const [isTyping, setIsTyping] = React.useState(false);
  const [newMessageId, setNewMessageId] = React.useState<string | null>(null);
  const [guestQuestionCount, setGuestQuestionCount] = React.useState<number>(0);

  // Baca kuota tamu dari localStorage saat mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("beauty_advisor_guest_count");
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          setGuestQuestionCount(parsed);
        }
      }
    } catch {
      // Abaikan jika localStorage tidak tersedia
    }
  }, []);

  const sessionUserMsgCount = messages.filter((m) => m.role === "user").length;
  const currentGuestQuestionsUsed = Math.max(guestQuestionCount, sessionUserMsgCount);
  const isGuestLimitReached = !isAuthenticated && currentGuestQuestionsUsed >= GUEST_QUESTION_LIMIT;
  const remainingQuestions = isAuthenticated
    ? Infinity
    : Math.max(0, GUEST_QUESTION_LIMIT - currentGuestQuestionsUsed);

  // Query Daftar Sesi Percakapan (hanya jika sudah login)
  const {
    data: conversations = [],
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["beautyConversations"],
    queryFn: chatApi.getConversations,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 2,
  });

  // Query Detail Percakapan saat memilih sesi riwayat
  const loadConversation = async (convId: string) => {
    try {
      setConversationId(convId);
      const detail = await chatApi.getConversationDetail(convId);
      const mapped: ChatMessage[] = detail.messages.map((m) => ({
        id: m.id,
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
        created_at: m.created_at,
      }));
      setMessages(mapped.length > 0 ? mapped : [INITIAL_AI_WELCOME_MESSAGE]);
    } catch {
      toast.error("Gagal memuat riwayat percakapan");
    }
  };

  // Mutasi Kirim Pesan
  const sendMutation = useMutation({
    mutationFn: chatApi.sendMessage,
    onSuccess: (data) => {
      // Hanya update conversationId & invalidate cache di sini.
      // Pesan AI diset setelah minDelay selesai di sendMessage.
      setConversationId(data.conversation_id);
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["beautyConversations"] });
      }
    },
    onError: (error: any) => {
      const detail =
        error?.response?.data?.detail ||
        "Maaf, terjadi gangguan pada AI Advisor. Silakan coba sesaat lagi.";
      toast.error("Gagal mengirim pesan", { description: detail });
    },
  });

  const sendMessage = async (text: string): Promise<boolean> => {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // Batasan untuk guest: maksimal 3 pertanyaan
    if (isGuestLimitReached) {
      toast.error("Batas pertanyaan tercapai", {
        description: "Silakan masuk terlebih dahulu untuk melanjutkan konsultasi.",
      });
      return false;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Update kuota tamu jika belum login
    const previousGuestCount = currentGuestQuestionsUsed;
    if (!isAuthenticated) {
      const nextCount = previousGuestCount + 1;
      setGuestQuestionCount(nextCount);
      try {
        localStorage.setItem("beauty_advisor_guest_count", String(nextCount));
      } catch {
        // Abaikan error localStorage
      }
    }

    try {
      const minDelay = new Promise<void>((resolve) => setTimeout(resolve, 3000));
      const [data] = await Promise.all([
        sendMutation.mutateAsync({
          message: trimmed,
          conversation_id: conversationId,
        }),
        minDelay,
      ]);

      // Tampilkan pesan AI setelah API selesai DAN minDelay 3 detik terpenuhi
      const assistantMsg: ChatMessage = {
        id: data.message_id,
        role: "assistant",
        content: data.reply,
        created_at: new Date().toISOString(),
        recommended_products: data.recommended_products,
        suggested_followups: data.suggested_followups,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setNewMessageId(assistantMsg.id);
      return true;
    } catch (err) {
      // Revert kuota jika gagal kirim
      if (!isAuthenticated) {
        setGuestQuestionCount(previousGuestCount);
        try {
          localStorage.setItem("beauty_advisor_guest_count", String(previousGuestCount));
        } catch {
          // Abaikan
        }
      }
      throw err;
    } finally {
      setIsTyping(false);
    }
  };

  const startNewChat = () => {
    setConversationId(null);
    setMessages([INITIAL_AI_WELCOME_MESSAGE]);
  };

  const deleteConversationMutation = useMutation({
    mutationFn: chatApi.deleteConversation,
    onSuccess: (_, deletedId) => {
      toast.success("Sesi konsultasi dihapus");
      queryClient.invalidateQueries({ queryKey: ["beautyConversations"] });
      if (conversationId === deletedId) {
        startNewChat();
      }
    },
    onError: () => {
      toast.error("Gagal menghapus percakapan");
    },
  });

  return {
    conversationId,
    messages,
    isLoading: isTyping,
    newMessageId,
    isAuthenticated,
    isGuestLimitReached,
    remainingQuestions,
    guestQuestionLimit: GUEST_QUESTION_LIMIT,
    guestQuestionsUsed: currentGuestQuestionsUsed,
    sendMessage,
    startNewChat,
    loadConversation,
    conversations,
    isLoadingConversations,
    deleteConversation: deleteConversationMutation.mutate,
    isDeletingConversation: deleteConversationMutation.isPending,
  };
}
