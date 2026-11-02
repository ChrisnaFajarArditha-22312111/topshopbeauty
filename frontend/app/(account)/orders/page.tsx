'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '@/features/auth/useAuth';
import { useOrders, useCancelOrder } from '@/features/orders/useOrders';
import { OrderStatusBadge } from '@/components/order/order-status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  PackageX,
  ShoppingBag,
  ChevronRight,
  Truck,
  Clock,
  RefreshCw,
  LogIn,
} from 'lucide-react';
import { BackButton } from '@/components/shared/back-button';
import { formatRupiah } from '@/lib/utils';
import { OrderStatus } from '@/features/orders/orderTypes';

const STATUS_TABS: { value: string; label: string }[] = [
  { value: 'all',        label: 'Semua' },
  { value: 'pending',    label: 'Menunggu Bayar' },
  { value: 'processing', label: 'Diproses' },
  { value: 'shipped',    label: 'Dikirim' },
  { value: 'completed',  label: 'Selesai' },
  { value: 'cancelled',  label: 'Dibatalkan' },
];

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const statusFilter = activeTab === 'all' ? undefined : activeTab;
  const { data: orders, isLoading, isError, refetch } = useOrders(statusFilter);
  const cancelOrder = useCancelOrder();

  const handleCancel = (orderId: string) => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
      cancelOrder.mutate(orderId, {
        onSuccess: () => toast.success('Pesanan berhasil dibatalkan.'),
        onError: () => toast.error('Gagal membatalkan pesanan.'),
      });
    }
  };

  /* ─── Not Authenticated ─────────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <LogIn className="w-9 h-9 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Masuk untuk melihat pesanan</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          Anda perlu masuk ke akun untuk melihat riwayat pesanan.
        </p>
        <Button onClick={() => router.push('/login')} className="rounded-full px-8">
          Masuk Sekarang
        </Button>
      </div>
    );
  }

  /* ─── Main Page ─────────────────────────────────────────────────── */
  return (
    <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 py-8 space-y-6">
      {/* Header dengan Tombol Kembali */}
      <BackButton href="/profile" label="Kembali ke Profil">
        <h1 className="text-2xl font-bold text-navy-900">Pesanan Saya</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Status &amp; pelacakan resi pengiriman semua pesanan Anda.
        </p>
      </BackButton>

      {/* Status Tabs — horizontal scroll */}
      <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        <div className="flex gap-2 w-max">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                activeTab === tab.value
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-muted-foreground border-border hover:border-primary/50 hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 flex justify-between items-center bg-muted/20">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
              <div className="p-5 space-y-3">
                {[1, 2].map((j) => (
                  <div key={j} className="flex gap-3 items-center">
                    <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border/50 flex justify-between items-center bg-muted/20">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-9 w-32 rounded-full" />
              </div>
            </div>
          ))}
        </div>

      /* Error State */
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-border/60">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <PackageX className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">Gagal memuat pesanan</h3>
          <p className="text-muted-foreground mb-6 text-sm">Periksa koneksi Anda dan coba lagi.</p>
          <Button onClick={() => refetch()} variant="outline" className="rounded-full gap-2">
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </Button>
        </div>

      /* Empty State */
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border-2 border-dashed border-border">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <ShoppingBag className="w-9 h-9 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-navy-900 mb-2">Belum ada pesanan</h3>
          <p className="text-muted-foreground max-w-xs mb-8 text-sm">
            {activeTab === 'all'
              ? 'Anda belum pernah membuat pesanan. Yuk mulai belanja!'
              : 'Tidak ada pesanan dengan status ini.'}
          </p>
          <Button asChild className="rounded-full px-8">
            <Link href="/products">Mulai Belanja</Link>
          </Button>
        </div>

      /* Order Cards */
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-200"
            >
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-3 bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-900">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </p>
                  </div>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              {/* Items */}
              <div className="px-5 py-4 space-y-3">
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    {/* Foto produk placeholder */}
                    <div className="w-14 h-14 rounded-xl bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-900 line-clamp-1">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.quantity} barang &times; {formatRupiah(item.price)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-navy-900 shrink-0">{formatRupiah(item.subtotal)}</p>
                  </div>
                ))}
                {order.items.length > 2 && (
                  <p className="text-xs text-muted-foreground pl-1">
                    +{order.items.length - 2} produk lainnya
                  </p>
                )}
              </div>

              {/* Kurir info (jika ada) */}
              {order.shipment && (
                <div className="px-5 py-2.5 border-t border-border/50 flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {order.shipment.courier_name || order.shipping_courier}
                    {order.shipment.tracking_number && (
                      <> &middot; Resi: <span className="font-mono font-semibold text-navy-900">{order.shipment.tracking_number}</span></>
                    )}
                  </span>
                </div>
              )}

              {/* Card Footer */}
              <div className="px-5 py-4 border-t border-border/50 flex flex-wrap items-center justify-between gap-4 bg-muted/20">
                <div>
                  <p className="text-xs text-muted-foreground">Total Belanja</p>
                  <p className="text-base font-bold text-primary">{formatRupiah(order.total_amount)}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Batalkan — hanya jika pending */}
                  {order.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancel(order.id)}
                      disabled={cancelOrder.isPending}
                      className="rounded-full text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                    >
                      Batalkan
                    </Button>
                  )}

                  {/* Bayar Sekarang — pending dengan URL Mayar */}
                  {order.status === 'pending' && order.payment?.mayar_payment_url && (
                    <Button
                      asChild
                      size="sm"
                      className="rounded-full bg-primary hover:bg-primary/90 text-white font-semibold"
                    >
                      <a href={order.payment.mayar_payment_url} target="_blank" rel="noopener noreferrer">
                        Bayar Sekarang
                      </a>
                    </Button>
                  )}

                  {/* Lacak Pengiriman */}
                  {['shipped', 'completed', 'delivered'].includes(order.status) && (
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <Link href={`/orders/${order.id}`}>
                        <Truck className="w-3.5 h-3.5 mr-1.5" />Lacak
                      </Link>
                    </Button>
                  )}

                  {/* Lihat Detail */}
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-primary hover:text-primary hover:bg-primary/10 font-semibold"
                  >
                    <Link href={`/orders/${order.id}`}>
                      Lihat Detail <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
