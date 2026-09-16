"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyCartIllustration } from "@/components/shared/illustrations";
import { BackButton } from "@/components/shared/back-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "@/features/cart/useCart";
import { useAuth } from "@/features/auth/useAuth";
import { formatRupiah } from "@/lib/utils";
import { toast } from "sonner";

export default function CartPage() {
  const { isAuthenticated, user } = useAuth();
  const { data: cart, isLoading, isError } = useCart();
  const updateCartItem = useUpdateCartItem();
  const removeCartItem = useRemoveCartItem();
  const clearCart = useClearCart();

  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Keranjang Belanja</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-sm">
          Silakan masuk terlebih dahulu untuk melihat dan mengelola keranjang belanja Anda.
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
        <h1 className="text-3xl font-bold text-navy-900 mb-8">Keranjang Belanja</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Gagal memuat keranjang</h2>
        <Button onClick={() => window.location.reload()} variant="outline">Coba Lagi</Button>
      </div>
    );
  }

  const hasItems = cart && cart.items && cart.items.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 min-h-[80vh]">
      <div className="flex items-center justify-between mb-8">
        <BackButton href="/products" label="Kembali ke Produk">
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Keranjang Belanja</h1>
        </BackButton>
        {hasItems && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 rounded-full">
                <Trash2 className="w-4 h-4 mr-2" /> Kosongkan
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Kosongkan Keranjang?</DialogTitle>
                <DialogDescription>
                  Tindakan ini akan menghapus semua produk dari keranjang belanja Anda. Anda yakin?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-full">Batal</Button>
                </DialogClose>
                <Button
                  className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => clearCart.mutate()}
                  disabled={clearCart.isPending}
                >
                  {clearCart.isPending ? "Menghapus..." : "Ya, Kosongkan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!hasItems ? (
        <div className="flex flex-col items-center justify-center py-14 px-6 bg-white rounded-3xl border border-border/50 shadow-sm overflow-hidden relative">
          {/* Decorative background blobs */}
          <div className="absolute -top-10 -left-10 w-44 h-44 rounded-full bg-blush-100 opacity-40 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-52 h-52 rounded-full bg-blush-100 opacity-35 blur-2xl pointer-events-none" />

          {/* Illustration */}
          <EmptyCartIllustration className="w-52 h-44 mb-2 animate-[float_3.5s_ease-in-out_infinite]" />

          {/* Text */}
          <h2 className="text-2xl font-bold text-navy-900 mb-2 text-center">
            Keranjang Anda masih kosong
          </h2>
          <p className="text-muted-foreground text-center max-w-xs text-sm leading-relaxed">
            Belum ada produk di keranjang. Temukan skincare &amp; kosmetik favorit Anda dan tambahkan sekarang!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-2xl border border-border/60 shadow-sm relative group transition-all hover:border-primary/30"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden bg-muted border border-border/40">
                  {item.foto_utama ? (
                    <Image
                      src={item.foto_utama}
                      alt={item.nama_produk}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ShoppingBag className="w-8 h-8 opacity-20" />
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="pr-8">
                    <Link href={`/products/${item.product_id}`} className="hover:text-primary transition-colors">
                      <h3 className="font-semibold text-navy-900 line-clamp-2">{item.nama_produk}</h3>
                    </Link>
                    <p className="text-primary font-bold mt-1">{formatRupiah(item.harga)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Stok: {item.stok}</p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-border rounded-full p-1 bg-muted/30">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                        onClick={() => updateCartItem.mutate({ itemId: item.id, data: { quantity: item.quantity - 1 } })}
                        disabled={item.quantity <= 1 || updateCartItem.isPending}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-full"
                        onClick={() => updateCartItem.mutate({ itemId: item.id, data: { quantity: item.quantity + 1 } })}
                        disabled={item.quantity >= item.stok || updateCartItem.isPending}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <p className="font-bold text-navy-900">{formatRupiah(item.subtotal)}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-8 w-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                  onClick={() => {
                    setDeletingId(item.id);
                    removeCartItem.mutate(item.id, {
                      onSettled: () => setDeletingId(null)
                    });
                  }}
                  disabled={removeCartItem.isPending && deletingId === item.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl border border-border/60 shadow-sm sticky top-28">
              <h3 className="text-lg font-bold text-navy-900 mb-4">Ringkasan Belanja</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Item</span>
                  <span>{cart.total_items} Barang</span>
                </div>
                <div className="flex justify-between font-bold text-lg text-navy-900 border-t border-border pt-3">
                  <span>Subtotal</span>
                  <span className="text-primary">{formatRupiah(cart.total_price)}</span>
                </div>
              </div>

              <Button asChild className="w-full rounded-full py-6 text-base font-bold shadow-md hover:shadow-lg transition-all group">
                <Link href="/checkout">
                  Lanjut ke Checkout
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
