"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  href: string;
  label?: string;
  /** Konten kanan (judul, deskripsi, dll.) */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Tombol kembali yang konsisten di seluruh halaman customer.
 *
 * Struktur:
 * ┌──────────────────────────────────────┐
 * │ [←]  <label breadcrumb>             │
 * │       <children (judul, desc, dll.)> │
 * └──────────────────────────────────────┘
 */
export function BackButton({ href, label, children, className }: BackButtonProps) {
  return (
    <div className={cn("flex items-start gap-3.5", className)}>
      <Link
        href={href}
        className="w-10 h-10 rounded-full border border-border/80 bg-white hover:bg-muted/50 flex items-center justify-center text-navy-900 hover:text-primary transition-colors shrink-0 shadow-xs mt-1"
        title={label ?? "Kembali"}
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      {(label || children) && (
        <div>
          {label && (
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary font-medium mb-1 transition-colors"
            >
              {label}
            </Link>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
