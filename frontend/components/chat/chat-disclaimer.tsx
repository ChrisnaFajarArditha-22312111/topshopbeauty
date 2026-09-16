"use client";

import { ShieldAlert, Info } from "lucide-react";

export function ChatDisclaimer({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
        <Info className="w-3 h-3 shrink-0 text-primary" />
        AI Beauty Advisor memberikan rekomendasi kecantikan &amp; kosmetik informatif, bukan diagnosis medis klinis.
      </p>
    );
  }

  return (
    <div className="bg-blush-100/50 border border-primary/20 rounded-2xl p-3 sm:p-3.5 flex items-start gap-2.5 text-left">
      <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="text-xs text-stone-600 leading-relaxed">
        <strong className="text-navy-800 font-semibold">Disclaimer Medis: </strong>
        Rekomendasi yang diberikan oleh AI Beauty Advisor bersifat edukatif &amp; informatif untuk membantu memilih kosmetik terdaftar BPOM. Jika Anda mengalami reaksi alergi akut, infeksi parah, atau kondisi medis kulit khusus, segera konsultasikan langsung ke dokter spesialis kulit (dermatolog).
      </div>
    </div>
  );
}
