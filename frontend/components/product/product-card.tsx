"use client";

import * as React from "react";
import Link from "next/link";
import { Heart, Star, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";

import { useAuth } from "@/features/auth/useAuth";
import { useAddToCart } from "@/features/cart/useCart";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/features/cart/useWishlist";

export interface ProductCardProps {
  id: string | number;
  name?: string | null;
  nama_produk?: string | null;
  brand?: string | null;
  brand_name?: string | null;
  price?: number | null;
  harga?: number | null;
  originalPrice?: number | null;
  harga_asli?: number | null;
  discountPercent?: number | null;
  diskon_persen?: string | number | null;
  rating?: number | null;
  soldCount?: number | null;
  terjual?: number | null;
  imageUrl?: string | null;
  foto_utama?: string | null;
  skinType?: string | null;
  skin_types?: Array<{ name: string }> | null;
  isAiRecommended?: boolean;
}

export function ProductCard({
  id,
  name,
  nama_produk,
  brand,
  brand_name,
  price,
  harga,
  originalPrice,
  harga_asli,
  discountPercent,
  diskon_persen,
  rating = 4.8,
  soldCount = 0,
  terjual = 0,
  imageUrl,
  foto_utama,
  skinType,
  skin_types,
  isAiRecommended = false,
}: ProductCardProps) {
  const displayName = name || nama_produk || "Produk Topshop";
  const displayBrand = brand || brand_name || "Topshop";
  const displayPrice = price ?? harga ?? 0;
  const displayOriginalPrice = originalPrice ?? (harga_asli ? Number(harga_asli) : undefined);
  const displayDiscount =
    discountPercent ??
    (diskon_persen ? parseInt(String(diskon_persen).replace(/\D/g, "")) : undefined);
  const displayRating = rating ?? 4.8;
  const displaySold = soldCount || terjual || 0;
  const displayImage = imageUrl || foto_utama;
  const displaySkinType =
    skinType || (skin_types && skin_types.length > 0 ? skin_types.map((s) => s.name).join(", ") : undefined);

  const { isAuthenticated } = useAuth();
  const addToCartMutation = useAddToCart();
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();
  const { data: wishlist } = useWishlist();

  const isItemInWishlist = Boolean(
    wishlist?.some((w) => String(w.product_id) === String(id) || String(w.id) === String(id))
  );

  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [isImageLoaded, setIsImageLoaded] = React.useState(false);
  const [isImageError, setIsImageError] = React.useState(false);

  React.useEffect(() => {
    setIsWishlisted(isItemInWishlist);
  }, [isItemInWishlist]);

  React.useEffect(() => {
    setIsImageLoaded(false);
    setIsImageError(false);
  }, [displayImage]);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Silakan masuk terlebih dahulu untuk menyimpan favorit", {
        action: {
          label: "Masuk",
          onClick: () => {
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          },
        },
      });
      return;
    }

    if (!isWishlisted) {
      setIsWishlisted(true);
      addToWishlistMutation.mutate(String(id), {
        onSuccess: () => {
          toast.success("Produk disimpan ke Favorit", {
            description: displayName,
          });
        },
        onError: () => {
          setIsWishlisted(false);
        },
      });
    } else {
      setIsWishlisted(false);
      removeFromWishlistMutation.mutate(String(id), {
        onSuccess: () => {
          toast.info("Dihapus dari Favorit");
        },
        onError: () => {
          setIsWishlisted(true);
        },
      });
    }
  };

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
      { product_id: String(id), quantity: 1 },
      {
        onSuccess: () => {
          toast.success("Berhasil masuk keranjang!", {
            description: `${displayName} • ${formatRupiah(displayPrice)}`,
            action: {
              label: "Buka Keranjang",
              onClick: () => (window.location.href = "/cart"),
            },
          });
        },
      }
    );
  };

  return (
    <Link
      href={`/products/${id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-border/70 hover:border-primary/40 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col relative"
    >
      {/* THUMBNAIL PHOTO & BADGES */}
      <div className="relative aspect-square w-full bg-stone-100 overflow-hidden flex items-center justify-center">
        {/* Shimmer skeleton loader yang tetap aktif sampai gambar selesai di-load */}
        {displayImage && !isImageLoaded && !isImageError && (
          <div className="absolute inset-0 z-0 bg-stone-200/75 animate-pulse" />
        )}

        {displayImage && !isImageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt=""
            aria-label={displayName}
            className={`w-full h-full object-cover object-center group-hover:scale-105 transition-opacity duration-500 relative z-0 ${
              isImageLoaded ? "opacity-100" : "opacity-0"
            }`}
            loading="lazy"
            onLoad={() => setIsImageLoaded(true)}
            onError={() => {
              setIsImageLoaded(true);
              setIsImageError(true);
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400 p-4 text-center">
            <Sparkles className="w-8 h-8 text-primary/40 mb-1" />
            <span className="text-[11px] font-medium">{displayBrand}</span>
          </div>
        )}

        {/* DISCOUNT BADGE */}
        {displayDiscount && displayDiscount > 0 ? (
          <Badge className="absolute top-2.5 left-2.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            -{displayDiscount}%
          </Badge>
        ) : isAiRecommended ? (
          <Badge className="absolute top-2.5 left-2.5 bg-primary/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Pilihan AI
          </Badge>
        ) : null}

        {/* WISHLIST BUTTON (AIRBNB STYLE TOP RIGHT) */}
        <button
          onClick={toggleWishlist}
          type="button"
          aria-label="Simpan ke Wishlist"
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs flex items-center justify-center text-foreground transition-transform active:scale-90 shadow-xs"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? "fill-rose-500 text-rose-500" : "text-stone-600 hover:text-rose-500"
            }`}
          />
        </button>

        {/* SKIN TYPE TAG BOTTOM OF IMAGE */}
        {displaySkinType && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1">
            <span className="text-[10px] font-medium bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-full line-clamp-1">
              {displaySkinType}
            </span>
          </div>
        )}
      </div>

      {/* PRODUCT INFORMATION */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-2.5">
        <div className="flex flex-col gap-1">
          {/* BRAND */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground line-clamp-1">
            {displayBrand}
          </span>

          {/* PRODUCT NAME */}
          <h3 className="font-semibold text-sm text-navy-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {displayName}
          </h3>

          {/* RATING & SALES */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <div className="flex items-center gap-0.5 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{displayRating.toFixed(1)}</span>
            </div>
            <span>•</span>
            <span>{displaySold > 0 ? `${displaySold}+ terjual` : "Baru"}</span>
          </div>
        </div>

        {/* PRICE & ADD TO CART */}
        <div className="flex items-end justify-between gap-2 pt-1 border-t border-border/40">
          <div className="flex flex-col">
            {displayOriginalPrice && displayOriginalPrice > displayPrice && (
              <span className="text-[11px] text-muted-foreground line-through">
                {formatRupiah(displayOriginalPrice)}
              </span>
            )}
            <span className="text-base font-bold text-navy-950">
              {formatRupiah(displayPrice)}
            </span>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={addToCartMutation.isPending}
            size="icon"
            variant="outline"
            className="rounded-full w-8 h-8 border-primary/40 text-primary hover:bg-primary hover:text-white transition-all shadow-2xs shrink-0"
            aria-label="Tambah ke Keranjang"
          >
            <ShoppingBag className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
