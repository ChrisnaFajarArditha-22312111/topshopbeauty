"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AirbnbSearchCapsuleProps {
  initialKeyword?: string;
  initialSkinType?: string;
  initialConcern?: string;
}

export function AirbnbSearchCapsule({
  initialKeyword = "",
  initialSkinType = "",
  initialConcern = "",
}: AirbnbSearchCapsuleProps) {
  const router = useRouter();
  const [keyword, setKeyword] = React.useState(initialKeyword);
  const [skinType, setSkinType] = React.useState(initialSkinType);
  const [concern, setConcern] = React.useState(initialConcern);

  // Shortcut Keyboard: Tekan '/' untuk langsung fokus ke input pencarian (Golden Rule 2)
  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("search", keyword.trim());
    if (skinType && skinType !== "all") params.set("skin_type", skinType);
    if (concern && concern !== "all") params.set("skin_concern", concern);

    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl sm:rounded-3xl md:rounded-full p-2 sm:p-3 shadow-md hover:shadow-lg transition-all duration-300 border border-border/80 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-border/60 gap-1 md:gap-0"
      >
        {/* SEGMEN 1: PENCARIAN NAMA PRODUK / BRAND */}
        <div className="flex-1 w-full px-4 py-2 flex flex-col text-left group cursor-text">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-navy-800 uppercase tracking-wider">
              Cari Produk
            </span>
            <kbd className="hidden sm:inline-block text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground border">
              /
            </kbd>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Serum, sunscreen, Garnier, Somethinc..."
            className="w-full text-sm font-medium text-foreground placeholder:text-muted-foreground/70 bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 mt-0.5"
          />
        </div>

        {/* SEGMEN 2: TIPE KULIT */}
        <div className="flex-1 w-full px-4 py-2 flex flex-col text-left">
          <span className="text-[11px] font-bold text-navy-800 uppercase tracking-wider">
            Tipe Kulit
          </span>
          <select
            value={skinType}
            onChange={(e) => setSkinType(e.target.value)}
            className="w-full text-sm font-medium text-foreground bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 mt-0.5 cursor-pointer"
          >
            <option value="all">Semua Jenis Kulit</option>
            <option value="Oily">Berminyak (Oily)</option>
            <option value="Dry">Kering (Dry)</option>
            <option value="Sensitive">Sensitif (Sensitive)</option>
            <option value="Combination">Kombinasi</option>
            <option value="Normal">Normal</option>
          </select>
        </div>

        {/* SEGMEN 3: MASALAH KULIT */}
        <div className="flex-1 w-full px-4 py-2 flex flex-col text-left">
          <span className="text-[11px] font-bold text-navy-800 uppercase tracking-wider flex items-center gap-1">
            Masalah Kulit <Sparkles className="w-3 h-3 text-primary" />
          </span>
          <select
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            className="w-full text-sm font-medium text-foreground bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 mt-0.5 cursor-pointer"
          >
            <option value="all">Semua Kebutuhan</option>
            <option value="Acne">Jerawat & Bruntusan (Acne)</option>
            <option value="Dullness">Kusam & Mencerahkan (Dullness)</option>
            <option value="Dark Spots">Noda Hitam / Bekas Jerawat</option>
            <option value="Hydration">Dehidrasi & Kering</option>
            <option value="Enlarged Pores">Pori-Pori Besar</option>
            <option value="Daily Maintenance">Perawatan Harian</option>
          </select>
        </div>

        {/* TOMBOL CARI AIRBNB STYLE (BULAT PLUM) */}
        <div className="w-full md:w-auto p-1 flex justify-end">
          <Button
            type="submit"
            size="icon"
            className="w-full md:w-12 h-12 rounded-full bg-primary hover:bg-plum-600 text-white shadow-md flex items-center justify-center gap-2 md:gap-0 transition-transform hover:scale-105"
            aria-label="Cari Produk"
          >
            <Search className="w-5 h-5" />
            <span className="md:hidden font-medium text-sm">Cari Sekarang</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
