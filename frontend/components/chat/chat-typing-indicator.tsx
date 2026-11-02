"use client";

import * as React from "react";
import Image from "next/image";

export function ChatTypingIndicator() {
  return (
    <div className="flex justify-start items-start gap-2.5 mb-6">
      {/* AI AVATAR */}
      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white border border-pink-200/90 shadow-xs flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
        <Image
          src="/logo.png"
          alt="Topshop AI"
          width={28}
          height={28}
          className="object-contain"
        />
      </div>

      {/* TYPING BUBBLE */}
      <div className="bg-white border border-border/80 rounded-2xl rounded-tl-xs px-4 py-3.5 shadow-xs flex items-center gap-1.5 h-[42px]">
        <span
          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "900ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: "150ms", animationDuration: "900ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: "300ms", animationDuration: "900ms" }}
        />
      </div>
    </div>
  );
}
