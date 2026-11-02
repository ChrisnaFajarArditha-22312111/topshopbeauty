"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Droplets,
  Sun,
  ShieldAlert,
  Flame,
  Smile,
  HeartHandshake,
  Layers,
  Sparkle,
} from "lucide-react";

export const categories = [
  { id: "all", label: "Semua Produk", icon: Layers, href: "/products" },
  { id: "Skincare", label: "Skincare Wajah", icon: Sparkles, href: "/products?category=Skincare" },
  { id: "Cleanser", label: "Pembersih / Cleanser", icon: Droplets, href: "/products?search=cleanser" },
  { id: "Serum", label: "Serum & Essence", icon: Sparkle, href: "/products?search=serum" },
  { id: "Sunscreen", label: "Sunscreen / Tabir Surya", icon: Sun, href: "/products?search=sunscreen" },
  { id: "Moisturizer", label: "Pelembap / Cream", icon: HeartHandshake, href: "/products?search=moisturizer" },
  { id: "Acne", label: "Jerawat & Acne Care", icon: ShieldAlert, href: "/products?skin_concern=Acne" },
  { id: "Makeup", label: "Makeup & Bibir", icon: Flame, href: "/products?category=Makeup" },
  { id: "Promo", label: "Diskon & Promo", icon: Smile, href: "/products?is_promo=true" },
];

export function CategoryCarousel() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  const currentSearch = searchParams.get("search");

  return (
    <div className="w-full border-b border-border/40 bg-white/50 backdrop-blur-xs py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-none py-1">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const isSelected =
              (cat.id === "all" && !currentCategory && !currentSearch) ||
              (cat.id === currentCategory) ||
              (cat.id.toLowerCase() === currentSearch?.toLowerCase());

            return (
              <Link
                key={cat.id}
                href={cat.href}
                className={`flex flex-col items-center gap-1.5 min-w-[72px] sm:min-w-[84px] py-1.5 px-2 rounded-2xl group transition-all text-center shrink-0 ${
                  isSelected
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-navy-800"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs scale-105"
                      : "bg-muted/70 group-hover:bg-blush-100 group-hover:text-primary"
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="text-xs tracking-tight line-clamp-1">{cat.label}</span>
                {isSelected && (
                  <span className="w-6 h-0.5 bg-primary rounded-full mt-0.5 animate-in fade-in" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
