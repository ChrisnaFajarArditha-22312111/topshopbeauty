"use client";

import * as React from "react";
import Image from "next/image";
import { Sparkles, User as UserIcon } from "lucide-react";
import { ChatEmbeddedProduct } from "./chat-embedded-product";
import { ChatSuggestions } from "./chat-suggestions";
import type { ChatMessage } from "@/features/beauty-advisor/chatTypes";

interface ChatBubbleProps {
  message: ChatMessage;
  onSelectSuggestion?: (suggestion: string) => void;
  isLoading?: boolean;
  isNew?: boolean;
}

export function ChatBubble({
  message,
  onSelectSuggestion,
  isLoading = false,
  isNew = false,
}: ChatBubbleProps) {
  const [mounted, setMounted] = React.useState(false);
  const isUser = message.role === "user";
  const shouldAnimate = isNew && !isUser;

  // Typewriter state — start empty if animating, full text otherwise
  const [displayedText, setDisplayedText] = React.useState(
    shouldAnimate ? "" : message.content
  );
  const [typingDone, setTypingDone] = React.useState(!shouldAnimate);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Typewriter effect — speed adapts to text length (max ~3s total)
  React.useEffect(() => {
    if (!shouldAnimate) return;

    setDisplayedText("");
    setTypingDone(false);

    const text = message.content;
    const totalDuration = 2500; // ms
    const delay = Math.max(8, Math.min(30, totalDuration / text.length));
    let i = 0;

    const interval = setInterval(() => {
      i++;
      setDisplayedText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setTypingDone(true);
      }
    }, delay);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message.id, shouldAnimate]);

  const formatTimeText = (dateStr?: string) => {
    if (!mounted || !dateStr) return "";
    try {
      return new Date(dateStr).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const renderContent = (text: string) => {
    // Parser sederhana untuk markdown bold (**teks**) dan linebreaks
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-bold text-navy-950">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  if (isUser) {
    return (
      <div className="flex justify-end items-end gap-2 mb-4">
        <div className="flex flex-col items-end max-w-[85%] sm:max-w-[70%]">
          <div className="bg-primary text-white rounded-2xl rounded-br-xs px-4 py-2.5 text-sm shadow-xs leading-relaxed break-words text-left whitespace-pre-line">
            {message.content}
          </div>
          <span
            suppressHydrationWarning
            className="text-[10px] text-muted-foreground mt-1 mr-1"
          >
            {formatTimeText(message.created_at)}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center shrink-0 shadow-2xs">
          <UserIcon className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // AI Bubble
  return (
    <div className="flex justify-start items-start gap-2.5 mb-6">
      {/* AI AVATAR */}
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white border border-pink-200/90 shadow-xs flex items-center justify-center shrink-0 mt-0.5">
        <Image
          src="/logo.png"
          alt="Topshop AI"
          width={28}
          height={28}
          className="object-contain"
        />
      </div>

      <div className="flex flex-col items-start max-w-[92%] sm:max-w-[80%] gap-3">
        {/* MESSAGE BUBBLE */}
        <div className="bg-white border border-border/80 text-navy-800 rounded-2xl rounded-tl-xs px-4 py-3.5 text-sm shadow-xs leading-relaxed whitespace-pre-line text-left">
          {renderContent(displayedText)}
          {/* Blinking cursor while typing */}
          {!typingDone && (
            <span className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle animate-pulse" />
          )}
        </div>

        {/* EMBEDDED RECOMMENDED PRODUCTS — hanya muncul setelah typing selesai */}
        {typingDone &&
          message.recommended_products &&
          message.recommended_products.length > 0 && (
            <div className="w-full flex flex-col gap-2 mt-1 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Rekomendasi Produk Terkait ({message.recommended_products.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
                {message.recommended_products.map((product) => (
                  <ChatEmbeddedProduct key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

        {/* FOLLOWUP SUGGESTION CHIPS — hanya muncul setelah typing selesai */}
        {typingDone &&
          message.suggested_followups &&
          message.suggested_followups.length > 0 &&
          onSelectSuggestion && (
            <div className="w-full mt-1 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
              <ChatSuggestions
                suggestions={message.suggested_followups}
                onSelect={onSelectSuggestion}
                disabled={isLoading}
              />
            </div>
          )}

        <span
          suppressHydrationWarning
          className="text-[10px] text-muted-foreground ml-1"
        >
          {formatTimeText(message.created_at)}
        </span>
      </div>
    </div>
  );
}
