'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { 
  ChevronLeft, 
  MapPin, 
  Receipt, 
  AlertCircle, 
  FileText, 
  Star, 
  PackageX, 
  QrCode, 
  Landmark, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { useOrderDetail, useCancelOrder, useTracking, useSyncPaymentStatus } from '@/features/orders/useOrders';
import { OrderStatusBadge } from '@/components/order/order-status-badge';
import { TrackingTimeline } from '@/components/order/tracking-timeline';
import { ReviewModal } from '@/components/order/review-modal';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatRupiah } from '@/lib/utils';
import { OrderItem } from '@/features/orders/orderTypes';

export default function OrderDetailPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [selectedReviewItem, setSelectedReviewItem] = useState<OrderItem | null>(null);

  const { data: order, isLoading, isError } = useOrderDetail(orderId);
  const cancelOrder = useCancelOrder();
  const syncPayment = useSyncPaymentStatus();

  // Redirect ke login jika tidak terautentikasi (aman di dalam useEffect)
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/login?redirect=/orders/${orderId}`);
    }
  }, [isAuthenticated, isAuthLoading, router, orderId]);

  // Auto-check status pembayaran Mayar saat halaman detail order dibuka
  useEffect(() => {
    if (order && order.status === 'pending') {
      syncPayment.mutate(orderId);
    }
  }, [order?.id, order?.status]);

  const { data: trackingData, isLoading: isTrackingLoading } = useTracking(
    order?.shipment?.tracking_number
  );

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-6 bg-muted rounded-full w-48" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-6 bg-muted rounded-full w-48" />
        <div className="h-32 bg-muted rounded-2xl" />
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center flex flex-col items-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-navy-900 mb-2">Pesanan Tidak Ditemukan</h2>
        <p className="text-muted-foreground mb-6">Pesanan yang Anda cari tidak ada atau terjadi kesalahan.</p>
        <Button asChild className="rounded-full px-6">
          <Link href="/orders">Kembali ke Riwayat Pesanan</Link>
        </Button>
      </div>
    );
  }

  const handleCancel = () => {
    if (window.confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
      cancelOrder.mutate(orderId);
    }
  };

  const showTracking = order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed';
  const canReview = order.status === 'delivered' || order.status === 'completed';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 pb-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-navy-900">Beranda</Link>
        <ChevronLeft className="h-4 w-4 rotate-180" />
        <Link href="/orders" className="hover:text-navy-900">Riwayat Pesanan</Link>
        <ChevronLeft className="h-4 w-4 rotate-180" />
        <span className="text-navy-900 font-medium">{order.order_number}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Detail Pesanan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {order.order_number} • {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
          </p>
        </div>
        <OrderStatusBadge status={order.status} className="text-sm px-3 py-1.5" />
      </div>

      {order.status === 'pending' && (
        <div className="bg-white border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <span className="bg-amber-100 text-amber-800 font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
                Menunggu Pembayaran
              </span>
              <h3 className="text-xl font-bold text-navy-900 mt-2">Instruksi Pembayaran</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Total yang harus dibayar: <span className="font-extrabold text-primary text-base">{formatRupiah(order.total_amount)}</span>
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={cancelOrder.isPending}
              className="border-destructive/30 text-destructive hover:bg-destructive/5 rounded-full"
            >
              Batalkan Pesanan
            </Button>
          </div>

          {/* Tombol Langsung ke Payment Link Mayar jika tersedia */}
          {order.payment?.mayar_payment_url && (
            <div className="p-4 bg-blush-50 border border-border/80 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="font-bold text-navy-900 text-sm">Portal Pembayaran Resmi Mayar</h4>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pilih metode pembayaran (QRIS, VA Bank, E-Wallet) dan bayar dengan mudah & aman di portal Mayar.
                </p>
              </div>
              <Button asChild className="bg-primary hover:bg-primary/90 text-white rounded-full shrink-0 gap-2 shadow-sm font-semibold">
                <a href={order.payment.mayar_payment_url} target="_blank" rel="noopener noreferrer">
                  Buka Pembayaran Mayar <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          )}

          {/* Card Metode Pembayaran */}
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-muted/20 p-6 rounded-2xl border border-border/60">
            <div className="w-52 h-52 bg-white border border-border rounded-2xl flex flex-col items-center justify-center p-3 shadow-sm shrink-0">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(order.payment?.mayar_payment_url || `https://topshopbeauty.cloud/orders/${order.id}`)}`}
                alt="QR Pembayaran Mayar Topshop"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="space-y-3.5 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-navy-900">Pembayaran Online Resmi Mayar</h4>
                  <p className="text-xs text-muted-foreground">Mendukung QRIS Bank Indonesia, VA BCA, Mandiri, BRI, BNI & E-Wallet</p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-border text-xs text-foreground space-y-2">
                <p className="font-semibold text-navy-900 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Cara Bayar dengan QRIS / M-Banking:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Klik tombol <strong className="text-primary">Buka Pembayaran Mayar</strong> di atas (atau scan QR di samping dengan kamera HP/Google Lens).</li>
                  <li>Di halaman Mayar, pilih metode <strong className="text-navy-900">QRIS</strong> atau <strong className="text-navy-900">Virtual Account</strong> bank Anda.</li>
                  <li>Scan QRIS resmi Bank Indonesia yang muncul dengan aplikasi m-banking atau e-wallet (BCA, Mandiri, GoPay, ShopeePay, DANA).</li>
                  <li>Setelah selesai, status pesanan di Topshop akan <strong>otomatis Lunas</strong> tanpa konfirmasi manual.</li>
                </ol>
              </div>

              {order.payment?.mayar_payment_url && (
                <Button asChild className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full gap-2 shadow-sm font-semibold">
                  <a href={order.payment.mayar_payment_url} target="_blank" rel="noopener noreferrer">
                    Bayar Sekarang di Portal Mayar <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>


          {/* Verifikasi Otomatis Tanpa WhatsApp */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-emerald-950 text-sm">Verifikasi Otomatis Terhubung ke Mayar</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Setelah Anda membayar, sistem akan memperbarui status secara instan. Tidak perlu kirim bukti transfer ke WhatsApp.
                </p>
              </div>
            </div>
            <Button 
              onClick={() => syncPayment.mutate(orderId)}
              disabled={syncPayment.isPending}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-2 text-xs font-semibold shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncPayment.isPending ? 'animate-spin' : ''}`} />
              {syncPayment.isPending ? 'Memeriksa Mayar...' : 'Cek Status Pembayaran'}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {showTracking && (
            <div className="bg-white border border-border/60 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Status Pengiriman
              </h2>
              <Separator className="mb-4" />
              <TrackingTimeline trackingData={trackingData} isLoading={isTrackingLoading} />
            </div>
          )}

          <div className="bg-white border border-border/60 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
              <PackageX className="h-4 w-4 text-primary" /> Produk yang Dibeli
            </h2>
            <Separator className="mb-4" />
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border/40 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-900">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.quantity} &times; {formatRupiah(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end w-full sm:w-auto">
                    <p className="text-sm font-bold text-navy-900">{formatRupiah(item.subtotal)}</p>
                    {canReview && !item.is_reviewed && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedReviewItem(item)} className="rounded-full text-primary border-primary/30 hover:bg-primary/5">
                        <Star className="h-3.5 w-3.5 mr-1.5 fill-primary text-primary" /> Beri Ulasan
                      </Button>
                    )}
                    {canReview && item.is_reviewed && (
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">Sudah Diulas</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-border/60 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Info Pengiriman
            </h2>
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Penerima</p>
                <p className="text-sm font-semibold text-navy-900">{order.shipping_recipient_name}</p>
                <p className="text-xs text-muted-foreground">{order.shipping_phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Kurir</p>
                <p className="text-sm font-semibold text-navy-900 uppercase">
                  {order.shipping_courier} - {order.shipping_service}
                </p>
                {order.shipment?.tracking_number && (
                  <p className="text-xs text-muted-foreground">Resi: <span className="font-mono font-semibold text-navy-900">{order.shipment.tracking_number}</span></p>
                )}
              </div>
              <div className="sm:col-span-2 mt-1">
                <p className="text-xs text-muted-foreground mb-1">Alamat Lengkap</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {order.shipping_address}, {order.shipping_city}
                </p>
              </div>
              {order.customer_notes && (
                <div className="sm:col-span-2 mt-1 bg-muted/30 p-3 rounded-xl border border-border/60">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1 font-medium">
                    <FileText className="h-3 w-3" /> Catatan
                  </p>
                  <p className="text-xs text-foreground italic">"{order.customer_notes}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-border/60 rounded-2xl p-5 sm:p-6 shadow-sm sticky top-24">
            <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" /> Rincian Pembayaran
            </h2>
            <Separator className="mb-4" />
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metode Pembayaran</span>
                <span className="font-semibold text-navy-900 capitalize">{order.payment?.payment_method?.replace('_', ' ') || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal Produk</span>
                <span className="font-semibold text-navy-900">{formatRupiah(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya Pengiriman</span>
                <span className="font-semibold text-navy-900">{formatRupiah(order.shipping_cost)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon Voucher {order.voucher_code ? `(${order.voucher_code})` : ''}</span>
                  <span className="font-semibold">-{formatRupiah(order.discount_amount)}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />
            
            <div className="flex justify-between items-end">
              <span className="text-sm font-bold text-navy-900">Total Pembayaran</span>
              <span className="text-xl font-bold text-primary">{formatRupiah(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      <ReviewModal 
        isOpen={!!selectedReviewItem} 
        onClose={() => setSelectedReviewItem(null)} 
        orderItem={selectedReviewItem} 
      />
    </div>
  );
}
