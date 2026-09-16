"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  ShoppingBag,
  Star,
  AlertCircle,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useWishlist,
  useRemoveFromWishlist,
  useMoveToCart,
} from "@/features/cart/useWishlist";
import { useAuth } from "@/features/auth/useAuth";
import { formatRupiah } from "@/lib/utils";
import { EmptyWishlistIllustration } from "@/components/shared/illustrations";
import { BackButton } from "@/components/shared/back-button";

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const { data: wishlist, isLoading, isError } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const moveToCart = useMoveToCart();

  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Heart className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Favorit Saya</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-sm">
          Silakan masuk terlebih dahulu untuk melihat produk favorit Anda.
        </p>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href="/login">Masuk ke Akun</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-navy-900 mb-8">Favorit Saya</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-10 w-full rounded-full mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Gagal memuat favorit</h2>
        <Button onClick={() => window.location.reload()} variant="outline">
          Coba Lagi
        </Button>
      </div>
    );
  }

  const hasItems = wishlist && wishlist.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[80vh]">
      <BackButton href="/profile" label="Kembali ke Profil" className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
          Favorit Saya ({wishlist?.length || 0})
        </h1>
      </BackButton>

      {!hasItems ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden relative">
          {/* Decorative background blobs */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blush-100 opacity-45 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-blush-100 opacity-35 blur-2xl pointer-events-none" />

          {/* Illustration */}
          <EmptyWishlistIllustration className="w-52 h-44 mb-2 animate-[float_4s_ease-in-out_infinite]" />

          {/* Text */}
          <h2 className="text-2xl font-bold text-navy-900 mb-2 text-center">
            Belum ada produk favorit
          </h2>
          <p className="text-muted-foreground text-center max-w-xs text-sm leading-relaxed">
            Tekan ikon hati ❤️ pada produk yang Anda suka untuk menyimpannya di
            sini. Beli nanti, kapan saja!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlist.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all hover:border-primary/30 relative"
            >
              {/* Image */}
              <Link
                href={`/products/${item.product_id}`}
                className="block relative aspect-square bg-muted/30"
              >
                {item.foto_utama ? (
                  <Image
                    src={item.foto_utama}
                    alt={item.nama_produk}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ShoppingBag className="w-10 h-10 opacity-20" />
                  </div>
                )}
                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground text-destructive shadow-sm rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    setProcessingId(item.product_id);
                    removeFromWishlist.mutate(item.product_id, {
                      onSettled: () => setProcessingId(null),
                    });
                  }}
                  disabled={
                    removeFromWishlist.isPending &&
                    processingId === item.product_id
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </Link>

              {/* Info */}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center gap-1 mb-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-medium">
                    {item.rating.toFixed(1)}
                  </span>
                </div>

                <Link
                  href={`/products/${item.product_id}`}
                  className="hover:text-primary transition-colors mb-2"
                >
                  <h3 className="font-semibold text-navy-900 text-sm line-clamp-2">
                    {item.nama_produk}
                  </h3>
                </Link>

                <div className="mt-auto mb-3">
                  <span className="text-primary font-bold">
                    {formatRupiah(item.price)}
                  </span>
                  {item.harga_asli && (
                    <span className="text-xs text-muted-foreground line-through ml-2">
                      {formatRupiah(item.harga_asli)}
                    </span>
                  )}
                </div>

                <Button
                  className="w-full rounded-full gap-2 text-xs font-semibold shadow-xs"
                  onClick={() => {
                    setProcessingId(item.product_id);
                    moveToCart.mutate(
                      { product_id: item.product_id },
                      {
                        onSettled: () => setProcessingId(null),
                      },
                    );
                  }}
                  disabled={
                    item.stok === 0 ||
                    (moveToCart.isPending && processingId === item.product_id)
                  }
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  {item.stok === 0 ? "Habis" : "Pindah ke Keranjang"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
