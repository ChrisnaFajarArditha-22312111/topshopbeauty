"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";
import type { RecommendedProduct } from "@/features/beauty-advisor/chatTypes";
import { useAuth } from "@/features/auth/useAuth";
import { useAddToCart } from "@/features/cart/useCart";

export function ChatEmbeddedProduct({ product }: { product: RecommendedProduct }) {
  const { isAuthenticated } = useAuth();
  const addToCartMutation = useAddToCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Silakan masuk terlebih dahulu untuk berbelanja", {
        action: {
          label: "Masuk",
          onClick: () => {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          },
        },
      });
      return;
    }

    addToCartMutation.mutate(
      { product_id: product.id, quantity: 1 },
      {
        onSuccess: () => {
          toast.success("Berhasil ditambahkan ke keranjang!", {
            description: `${product.nama_produk} • ${formatRupiah(product.harga)}`,
            action: {
              label: "Buka Keranjang",
              onClick: () => {
                window.location.href = "/cart";
              },
            },
          });
        },
      }
    );
  };

  const [isImgLoaded, setIsImgLoaded] = React.useState(false);
  const [isImgError, setIsImgError] = React.useState(false);

  return (
    <div className="bg-white rounded-2xl border border-border/80 hover:border-primary/40 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col sm:flex-row items-stretch sm:items-center p-3 gap-3">
      {/* THUMBNAIL */}
      <div className="relative w-full sm:w-20 h-28 sm:h-20 bg-stone-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
        {product.foto_utama && !isImgLoaded && !isImgError && (
          <div className="absolute inset-0 z-0 bg-stone-200/75 animate-pulse" />
        )}
        {product.foto_utama && !isImgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.foto_utama}
            alt=""
            aria-label={product.nama_produk}
            className={`w-full h-full object-cover object-center transition-opacity duration-300 relative z-0 ${
              isImgLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setIsImgLoaded(true)}
            onError={() => {
              setIsImgLoaded(true);
              setIsImgError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground font-semibold">
            {product.brand || "Topshop"}
          </div>
        )}
        {product.stok <= 5 && product.stok > 0 && (
          <Badge className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] px-1.5 py-0 h-4 rounded-md font-bold">
            Sisa {product.stok}
          </Badge>
        )}
      </div>

      {/* INFO */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          {product.brand && (
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
              {product.brand}
            </span>
          )}
          <Link
            href={`/products/${product.id}`}
            className="font-bold text-xs sm:text-sm text-navy-800 line-clamp-1 hover:text-primary transition-colors block"
          >
            {product.nama_produk}
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[11px]">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{product.rating?.toFixed(1) || "4.8"}</span>
            </div>
            <span>•</span>
            <span className="font-extrabold text-navy-950 text-xs sm:text-sm">
              {formatRupiah(product.harga)}
            </span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            className="h-8 rounded-full bg-primary hover:bg-rose-600 text-white text-xs font-semibold px-3 gap-1 shadow-2xs"
          >
            <ShoppingBag className="w-3 h-3" /> Tambah
          </Button>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="h-8 rounded-full text-xs font-medium px-3 border-border/80 hover:border-primary/40 hover:text-primary gap-1"
          >
            <Link href={`/products/${product.id}`}>
              Detail <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
