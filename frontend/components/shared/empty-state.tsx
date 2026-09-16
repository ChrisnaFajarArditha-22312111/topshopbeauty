"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PackageSearch, SearchX, ShoppingBag, Inbox, AlertCircle } from "lucide-react";

type EmptyStateVariant = "search" | "products" | "orders" | "wishlist" | "generic" | "error";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const variantConfig: Record<
  EmptyStateVariant,
  { Icon: React.ElementType; defaultTitle: string; defaultDescription: string; iconClass: string }
> = {
  search: {
    Icon: SearchX,
    defaultTitle: "Produk Tidak Ditemukan",
    defaultDescription:
      "Tidak ada produk yang cocok dengan pencarian atau filter Anda. Coba gunakan kata kunci yang lebih umum.",
    iconClass: "text-primary",
  },
  products: {
    Icon: PackageSearch,
    defaultTitle: "Belum Ada Produk",
    defaultDescription: "Saat ini belum ada produk yang tersedia. Silakan cek kembali nanti.",
    iconClass: "text-primary",
  },
  orders: {
    Icon: ShoppingBag,
    defaultTitle: "Belum Ada Pesanan",
    defaultDescription: "Anda belum memiliki riwayat pesanan. Mulai berbelanja sekarang!",
    iconClass: "text-primary",
  },
  wishlist: {
    Icon: Inbox,
    defaultTitle: "Wishlist Masih Kosong",
    defaultDescription: "Belum ada produk di wishlist Anda. Tekan ikon hati pada produk yang Anda suka!",
    iconClass: "text-rose-500",
  },
  generic: {
    Icon: Inbox,
    defaultTitle: "Tidak Ada Data",
    defaultDescription: "Tidak ada data yang tersedia saat ini.",
    iconClass: "text-muted-foreground",
  },
  error: {
    Icon: AlertCircle,
    defaultTitle: "Terjadi Kesalahan",
    defaultDescription: "Gagal memuat data. Periksa koneksi internet Anda dan coba lagi.",
    iconClass: "text-destructive",
  },
};

export function EmptyState({
  variant = "generic",
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const { Icon, defaultTitle, defaultDescription, iconClass } = variantConfig[variant];

  return (
    <div
      className={cn(
        "bg-white rounded-3xl p-10 border border-border/80 shadow-xs flex flex-col items-center justify-center text-center gap-4",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-blush-100 flex items-center justify-center">
        <Icon className={cn("w-8 h-8", iconClass)} />
      </div>
      <div className="max-w-sm">
        <h3 className="font-bold text-lg text-navy-800">{title || defaultTitle}</h3>
        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
          {description || defaultDescription}
        </p>
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="rounded-full bg-primary hover:bg-rose-600 text-white font-semibold text-xs px-6 shadow-sm mt-1"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
