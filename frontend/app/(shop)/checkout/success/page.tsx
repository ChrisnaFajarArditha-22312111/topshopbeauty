"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!orderId) {
      router.push("/");
    }
  }, [orderId, router]);

  if (!mounted || !orderId) return null;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-border/60 shadow-lg max-w-lg w-full text-center animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-navy-900 mb-2">Pesanan Berhasil!</h1>
        <p className="text-muted-foreground mb-6">
          Terima kasih telah berbelanja di Topshop Kosmetik. Pesanan Anda sedang kami proses.
        </p>

        <div className="bg-muted/30 p-4 rounded-2xl border border-border mb-8 text-left flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-xl border border-border flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">ID Pesanan</p>
            <p className="font-mono font-bold text-navy-900">{orderId}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button asChild variant="outline" className="flex-1 rounded-full py-6 font-semibold">
            <Link href="/products">Lanjut Belanja</Link>
          </Button>
          <Button asChild className="flex-1 rounded-full py-6 font-semibold shadow-md group bg-rose-600 hover:bg-rose-700 text-white">
            <Link href={`/orders/${orderId}`}>
              Bayar Sekarang <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center">Memuat...</div>}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
