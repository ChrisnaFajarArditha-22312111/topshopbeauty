"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  Star,
  Heart,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Minus,
  Plus,
  ArrowLeft,
  Share2,
  Loader2,
  MessageSquare,
  Sparkle,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProductReviews } from "@/components/product/product-reviews";
import { useProductDetail } from "@/features/products/useProductDetail";
import { formatRupiah, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/useAuth";
import { useAddToCart } from "@/features/cart/useCart";
import { useWishlist, useAddToWishlist, useRemoveFromWishlist } from "@/features/cart/useWishlist";

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = (params.id as string) || "";

  const {
    product,
    isLoading,
    reviews: backendReviews,
    isLoadingReviews,
  } = useProductDetail(productId);

  const reviews = backendReviews?.reviews || [];
  const averageRating = backendReviews?.average_rating || product?.rating || 4.9;
  const totalReviews = backendReviews?.total_reviews || reviews.length;

  const allImages = React.useMemo(() => {
    if (!product) return [];
    if (product.images && product.images.length > 0) {
      return product.images.map((img) => img.image_url);
    }
    return [product.foto_utama || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80"];
  }, [product]);

  const [selectedImage, setSelectedImage] = React.useState<string>("");
  const [isMainImageLoaded, setIsMainImageLoaded] = React.useState<boolean>(false);
  const [quantity, setQuantity] = React.useState<number>(1);

  React.useEffect(() => {
    setIsMainImageLoaded(false);
  }, [selectedImage]);

  React.useEffect(() => {
    if (allImages.length > 0) {
      setSelectedImage(allImages[0]);
    }
  }, [allImages]);

  const { isAuthenticated } = useAuth();
  const addToCartMutation = useAddToCart();
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();
  const { data: wishlist } = useWishlist();

  const isItemInWishlist = Boolean(
    product && wishlist?.some((w) => String(w.product_id) === String(product.id) || String(w.id) === String(product.id))
  );

  const [isWishlisted, setIsWishlisted] = React.useState(false);

  React.useEffect(() => {
    setIsWishlisted(isItemInWishlist);
  }, [isItemInWishlist]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast.error("Silakan masuk terlebih dahulu untuk berbelanja", {
        action: {
          label: "Masuk",
          onClick: () => router.push(`/login?redirect=/products/${product.id}`),
        },
      });
      return;
    }

    addToCartMutation.mutate(
      { product_id: product.id, quantity },
      {
        onSuccess: () => {
          toast.success("Berhasil ditambahkan ke keranjang!", {
            description: `${quantity}x ${product.nama_produk} (${formatRupiah(product.harga * quantity)})`,
            action: {
              label: "Lihat Keranjang",
              onClick: () => router.push("/cart"),
            },
          });
        },
      }
    );
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${product.id}`);
      return;
    }

    addToCartMutation.mutate(
      { product_id: product.id, quantity },
      {
        onSuccess: () => {
          router.push("/cart");
        },
      }
    );
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast.error("Silakan masuk terlebih dahulu untuk menyimpan favorit", {
        action: {
          label: "Masuk",
          onClick: () => router.push(`/login?redirect=/products/${product.id}`),
        },
      });
      return;
    }

    if (!isWishlisted) {
      setIsWishlisted(true);
      addToWishlistMutation.mutate(product.id, {
        onSuccess: () => {
          toast.success("Disimpan ke Favorit", { description: product.nama_produk });
        },
        onError: () => {
          setIsWishlisted(false);
        },
      });
    } else {
      setIsWishlisted(false);
      removeFromWishlistMutation.mutate(product.id, {
        onSuccess: () => {
          toast.info("Dihapus dari Favorit");
        },
        onError: () => {
          setIsWishlisted(true);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-16">
          <Package className="w-16 h-16 text-slate-300 mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Produk Tidak Ditemukan</h1>
          <p className="text-sm text-slate-500 mb-6 max-w-md">
            Produk yang Anda cari tidak tersedia atau telah dihapus dari katalog Topshop Kosmetik.
          </p>
          <Button asChild className="rounded-full bg-primary hover:bg-rose-600 text-white">
            <Link href="/products">Kembali ke Katalog</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-blush-100 selection:text-primary">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* BREADCRUMBS */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 overflow-x-auto scrollbar-none whitespace-nowrap py-1">
          <Link href="/" className="hover:text-primary transition-colors">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/products" className="hover:text-primary transition-colors">
            Katalog Produk
          </Link>
          {product.category_name && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link
                href={`/products?category=${encodeURIComponent(product.category_name)}`}
                className="hover:text-primary transition-colors"
              >
                {product.category_name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-navy-900 font-semibold truncate max-w-xs">
            {product.nama_produk}
          </span>
        </nav>

        {/* TOP SECTION: PHOTO GALLERY + PRODUCT BUY PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* PHOTO GALLERY (LEFT - 6 COLS) */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            {/* MAIN IMAGE */}
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-stone-100 border border-border/80 shadow-xs flex items-center justify-center group">
              {!isMainImageLoaded && (
                <div className="absolute inset-0 z-0 bg-stone-200/75 animate-pulse" />
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage}
                alt=""
                aria-label={product.nama_produk}
                className={`w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105 relative z-0 ${
                  isMainImageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setIsMainImageLoaded(true)}
              />

              {/* DISCOUNT BADGE */}
              {product.diskon_persen && (
                <Badge className="absolute top-4 left-4 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
                  Diskon {product.diskon_persen}
                </Badge>
              )}

              {/* WISHLIST BUTTON */}
              <button
                onClick={handleToggleWishlist}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white backdrop-blur-xs flex items-center justify-center shadow-xs transition-transform active:scale-90"
                aria-label="Wishlist"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishlisted ? "fill-rose-500 text-rose-500" : "text-stone-600 hover:text-rose-500"
                  }`}
                />
              </button>
            </div>

            {/* THUMBNAIL STRIP */}
            {allImages.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto py-1">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`relative w-18 h-18 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                      selectedImage === imgUrl
                        ? "border-primary shadow-xs ring-2 ring-primary/20 scale-105"
                        : "border-border/70 hover:border-primary/40 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* VALUE PROPOSITIONS */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/60">
              <div className="flex items-center gap-2 text-stone-600">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
                <span className="text-xs font-medium">100% Produk Original BPOM</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <Truck className="w-5 h-5 text-primary shrink-0" />
                <span className="text-xs font-medium">Pengiriman Biteship Instan</span>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <RotateCcw className="w-5 h-5 text-primary shrink-0" />
                <span className="text-xs font-medium">Garansi Retur 7 Hari</span>
              </div>
            </div>
          </div>

          {/* PRODUCT BUY PANEL (RIGHT - 6 COLS) */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* TITLE & BRAND */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                {product.brand_name || "Topshop Kosmetik"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-800 tracking-tight leading-tight">
                {product.nama_produk}
              </h1>

              {/* RATING, SOLD, STOCK */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pt-1">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{averageRating.toFixed(1)}</span>
                </div>
                <span>•</span>
                <span className="text-stone-700 font-medium">
                  {totalReviews} Ulasan Pembeli
                </span>
                <span>•</span>
                <span className="text-stone-700 font-medium">
                  {product.terjual > 0 ? `${product.terjual}+ Terjual` : "Baru Masuk"}
                </span>
                <span>•</span>
                {product.stok > 0 ? (
                  <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[11px]">
                    Stok Tersedia ({product.stok})
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-destructive border-destructive/30 bg-rose-50 text-[11px]">
                    Stok Habis
                  </Badge>
                )}
              </div>
            </div>

            {/* PRICE SECTION */}
            <div className="bg-blush-100/40 rounded-2xl p-4 sm:p-5 border border-primary/20 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-navy-950">
                {formatRupiah(product.harga)}
              </span>
              {product.harga_asli && product.harga_asli > product.harga && (
                <>
                  <span className="text-sm sm:text-base text-muted-foreground line-through font-medium">
                    {formatRupiah(product.harga_asli)}
                  </span>
                  <Badge className="bg-rose-500 text-white font-bold text-xs px-2 py-0.5 rounded-full">
                    Hemat {product.diskon_persen || "Diskon"}
                  </Badge>
                </>
              )}
            </div>

            {/* ATTRIBUTES: USAGE TIME & TEXTURE */}
            {(product.usage_time || product.texture) && (
              <div className="flex items-center gap-4 text-xs">
                {product.usage_time && (
                  <div className="flex items-center gap-1.5 text-stone-700 bg-white px-3 py-1.5 rounded-xl border border-border/80">
                    <span className="font-bold text-navy-800">Waktu Pakai:</span>
                    <span>{product.usage_time}</span>
                  </div>
                )}
                {product.texture && (
                  <div className="flex items-center gap-1.5 text-stone-700 bg-white px-3 py-1.5 rounded-xl border border-border/80">
                    <span className="font-bold text-navy-800">Tekstur:</span>
                    <span>{product.texture}</span>
                  </div>
                )}
              </div>
            )}

            {/* SKIN COMPATIBILITY & CONCERNS */}
            <div className="flex flex-col gap-3 pt-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-navy-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" /> Kecocokan Kulit Anda
              </h3>

              {/* SKIN TYPES */}
              {product.skin_types && product.skin_types.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-stone-500 font-medium">Tipe Kulit:</span>
                  {product.skin_types.map((st) => (
                    <Badge
                      key={st.id}
                      variant="secondary"
                      className="bg-white border border-border/80 text-navy-800 font-medium rounded-full px-3 py-0.5"
                    >
                      {st.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* SKIN CONCERNS */}
              {product.skin_concerns && product.skin_concerns.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-stone-500 font-medium">Mengatasi:</span>
                  {product.skin_concerns.map((sc) => (
                    <Badge
                      key={sc.id}
                      className="bg-blush-100 text-primary border border-primary/20 font-medium rounded-full px-3 py-0.5"
                    >
                      {sc.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* QUANTITY & BUY ACTION BUTTONS */}
            <div className="flex flex-col gap-4 pt-4 border-t border-border/60">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-navy-800">
                  Jumlah:
                </span>
                <div className="flex items-center border border-border/80 bg-white rounded-full p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-navy-950">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.min(product.stok || 99, prev + 1))}
                    disabled={quantity >= (product.stok || 99)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-xs text-muted-foreground">
                  Subtotal: <strong className="text-navy-900">{formatRupiah(product.harga * quantity)}</strong>
                </span>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  onClick={handleAddToCart}
                  disabled={product.stok <= 0}
                  variant="outline"
                  className="rounded-full h-12 border-primary text-primary hover:bg-blush-100 font-bold text-sm gap-2"
                >
                  <ShoppingBag className="w-4 h-4" /> Tambah ke Keranjang
                </Button>

                <Button
                  onClick={handleBuyNow}
                  disabled={product.stok <= 0}
                  className="rounded-full h-12 bg-primary hover:bg-rose-600 text-white font-bold text-sm shadow-md gap-2"
                >
                  Beli Sekarang
                </Button>
              </div>
            </div>

            {/* AI BEAUTY ADVISOR CALLOUT PROMPT */}
            <div className="bg-gradient-to-r from-pink-soft via-white to-blush-100 border border-primary/25 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-navy-800">
                    Bingung apakah produk ini cocok untuk kulit Anda?
                  </h4>
                  <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    Konsultasikan langsung dengan AI Beauty Advisor Topshop!
                  </p>
                </div>
              </div>

              <Button
                asChild
                size="sm"
                className="rounded-full bg-primary hover:bg-plum-600 text-white font-bold text-xs px-4 shrink-0 shadow-xs"
              >
                <Link href={`/beauty-advisor?product=${encodeURIComponent(product.nama_produk)}`}>
                  Tanya AI
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: INGREDIENTS + CUSTOMER REVIEWS */}
        <div className="mt-16 pt-12 border-t border-border/60 flex flex-col gap-12">
          {/* INGREDIENTS LIST */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-extrabold text-navy-800 tracking-tight flex items-center gap-2">
                <Sparkle className="w-5 h-5 text-primary" /> Kandungan Bahan Aktif (Ingredients)
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {product.ingredients.map((ing) => (
                  <Badge
                    key={ing.id}
                    variant="outline"
                    className="bg-white border-border/80 text-stone-700 font-medium px-3.5 py-1.5 rounded-2xl text-xs"
                  >
                    {ing.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOMER REVIEWS — menggunakan komponen ProductReviews */}
          <ProductReviews
            summary={backendReviews ?? (reviews.length > 0 ? {
              total_reviews: totalReviews,
              average_rating: averageRating,
              reviews: reviews,
            } : undefined)}
            isLoading={isLoadingReviews}
          />
        </div>
      </main>
    </div>
  );
}
