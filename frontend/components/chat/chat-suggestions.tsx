"use client";

import { Sparkles } from "lucide-react";

interface ChatSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export function ChatSuggestions({
  suggestions,
  onSelect,
  disabled = false,
}: ChatSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
        <Sparkles className="w-3 h-3 text-primary" /> Rekomendasi Pertanyaan:
      </span>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item)}
            className="text-xs bg-white hover:bg-blush-100/70 border border-border/80 hover:border-primary/40 text-stone-700 hover:text-primary rounded-full px-3 py-1.5 transition-all text-left shadow-2xs disabled:opacity-50 active:scale-98"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
