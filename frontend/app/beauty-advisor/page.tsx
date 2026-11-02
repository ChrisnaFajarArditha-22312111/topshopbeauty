"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Send, Loader2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/layout/navbar";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { ChatDisclaimer } from "@/components/chat/chat-disclaimer";
import { ChatTypingIndicator } from "@/components/chat/chat-typing-indicator";
import { useBeautyChat } from "@/features/beauty-advisor/useBeautyChat";

function BeautyAdvisorChatContent() {
  const searchParams = useSearchParams();
  const initialProductQuery = searchParams.get("product");

  const {
    messages,
    isLoading,
    newMessageId,
    isAuthenticated,
    isGuestLimitReached,
    remainingQuestions,
    guestQuestionLimit,
    sendMessage,
  } = useBeautyChat();

  const [mounted, setMounted] = React.useState(false);
  const [inputMessage, setInputMessage] = React.useState("");
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveIsGuestLimitReached = mounted && isGuestLimitReached;

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // If redirected from a specific product (?product=...), trigger an initial greeting/inquiry
  React.useEffect(() => {
    if (initialProductQuery && messages.length === 1) {
      if (isGuestLimitReached) {
        setShowLoginModal(true);
        return;
      }
      const prompt = `Halo, saya ingin bertanya tentang kecocokan produk "${initialProductQuery}" untuk tipe kulit dan masalah kulit saya. Bisakah berikan ulasan dan sarannya?`;
      sendMessage(prompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProductQuery, isGuestLimitReached]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveIsGuestLimitReached) {
      setShowLoginModal(true);
      return;
    }
    if (!inputMessage.trim() || isLoading) return;
    sendMessage(inputMessage);
    setInputMessage("");
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (effectiveIsGuestLimitReached) {
      setShowLoginModal(true);
      return;
    }
    sendMessage(suggestion);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-blush-100 selection:text-primary">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">

        {/* CHAT MESSAGES CONTAINER */}
        <div className="flex-1 rounded-3xl border border-border/80 shadow-xs overflow-hidden">
          <div className="overflow-y-auto bg-white/70 backdrop-blur-xs p-4 sm:p-6 flex flex-col min-h-[420px] max-h-[62vh]">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                message={msg}
                onSelectSuggestion={handleSelectSuggestion}
                isLoading={isLoading}
                isNew={msg.id === newMessageId}
              />
            ))}

            {/* AI TYPING INDICATOR */}
            {isLoading && <ChatTypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* INPUT PROMPT BAR */}
        <div className="mt-4 flex flex-col gap-2">
          {/* BANNER BATAS KUOTA TAMU TERCAPAI */}
          {effectiveIsGuestLimitReached && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-950">
                    Batas 3 Pertanyaan Tamu Tercapai
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Silakan masuk atau buat akun baru untuk melanjutkan konsultasi tanpa batas.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <Button
                  size="sm"
                  asChild
                  className="flex-1 sm:flex-initial h-8 rounded-full bg-primary hover:bg-rose-600 text-white text-xs font-semibold px-4 shadow-xs"
                >
                  <Link href="/login?redirect=/beauty-advisor">Masuk</Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex-1 sm:flex-initial h-8 rounded-full border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-semibold px-3"
                >
                  <Link href="/register?redirect=/beauty-advisor">Daftar</Link>
                </Button>
              </div>
            </div>
          )}

          {/* INDIKATOR KUOTA TAMU SEBELUM HABIS */}
          {mounted && !isAuthenticated && !isGuestLimitReached && (
            <div className="flex items-center justify-between text-xs px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-900">
              <span className="flex items-center gap-1.5 text-[11px] font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Sisa pertanyaan gratis:{" "}
                <strong className="font-bold text-amber-800">
                  {remainingQuestions} dari {guestQuestionLimit}
                </strong>
              </span>
              <Link
                href="/login?redirect=/beauty-advisor"
                className="font-semibold text-primary hover:underline hover:text-rose-600 transition-colors text-[11px]"
              >
                Masuk untuk akses tanpa batas →
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="relative flex items-center">
            <Input
              ref={inputRef}
              type="text"
              suppressHydrationWarning
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onClick={() => {
                if (effectiveIsGuestLimitReached) setShowLoginModal(true);
              }}
              placeholder={
                effectiveIsGuestLimitReached
                  ? "Batas 3 pertanyaan tercapai. Masuk untuk melanjutkan..."
                  : "Ceritakan tipe kulit, masalah jerawat/kusam, atau cari rekomendasi..."
              }
              disabled={isLoading || effectiveIsGuestLimitReached}
              className="pl-5 pr-14 rounded-full h-12 text-sm bg-white border-border/80 shadow-xs focus-visible:ring-primary disabled:opacity-75 disabled:cursor-not-allowed"
            />
            <Button
              type="submit"
              size="icon"
              suppressHydrationWarning
              disabled={Boolean(!inputMessage.trim() || isLoading || effectiveIsGuestLimitReached)}
              className="absolute right-1.5 w-9 h-9 rounded-full bg-primary hover:bg-rose-600 text-white shadow-xs disabled:opacity-40 transition-transform active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : effectiveIsGuestLimitReached ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          {/* COMPACT FOOTER DISCLAIMER */}
          <ChatDisclaimer compact />
        </div>

        {/* MODAL DIALOG LOGIN REQUIRED */}
        <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
          <DialogContent className="sm:max-w-md p-6 rounded-3xl">
            <DialogHeader className="text-center sm:text-center items-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-2 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <DialogTitle className="text-lg font-extrabold text-navy-900">
                Batas Konsultasi Tamu Tercapai
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1.5 leading-relaxed text-center">
                Anda telah menggunakan kuota 3 kesempatan bertanya gratis. Silakan masuk ke akun Anda atau daftar baru untuk melanjutkan konsultasi tanpa batas dengan AI Beauty Advisor.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2.5 mt-4">
              <Button
                asChild
                className="w-full rounded-full bg-primary hover:bg-rose-600 text-white font-semibold h-10 shadow-xs"
              >
                <Link href="/login?redirect=/beauty-advisor">
                  Masuk ke Akun
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="w-full rounded-full border-border/80 hover:border-primary/40 text-stone-700 font-semibold h-10"
              >
                <Link href="/register?redirect=/beauty-advisor">
                  Daftar Akun Baru
                </Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default function BeautyAdvisorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <BeautyAdvisorChatContent />
    </React.Suspense>
  );
}
