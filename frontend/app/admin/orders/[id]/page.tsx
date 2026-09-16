"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  CreditCard,
  MapPin,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  FileText,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useAdminOrderDetail,
  useUpdateOrderStatus,
  useInputOrderTracking,
} from "@/features/admin/useAdmin";
import { OrderStatus } from "@/features/admin/adminTypes";
import { formatRupiah, formatDate } from "@/lib/utils";

const statusLabel: Record<string, string> = {
  pending: "Menunggu Bayar",
  paid: "Sudah Dibayar",
  processing: "Sedang Diproses",
  shipped: "Sedang Dikirim",
  delivered: "Sampai Tujuan",
  completed: "Pesanan Selesai",
  cancelled: "Dibatalkan",
  refunded: "Dana Dikembalikan",
};

const statusBadgeColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-violet-100 text-violet-800 border-violet-200",
  shipped: "bg-cyan-100 text-cyan-800 border-cyan-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  refunded: "bg-slate-100 text-slate-800 border-slate-200",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const { data: order, isLoading, isError, refetch } = useAdminOrderDetail(orderId);
  const updateStatusMutation = useUpdateOrderStatus();
  const inputTrackingMutation = useInputOrderTracking();

  // Status Modal State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>("processing");
  const [statusNotes, setStatusNotes] = useState("");

  // Tracking Modal State
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [courier, setCourier] = useState("jne");
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleOpenStatusModal = () => {
    if (order) setNewStatus(order.status as OrderStatus);
    setStatusNotes("");
    setStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!order) return;
    await updateStatusMutation.mutateAsync({
      id: order.id,
      data: {
        status: newStatus,
        notes: statusNotes ? statusNotes : undefined,
      },
    });
    setStatusModalOpen(false);
  };

  const handleOpenTrackingModal = () => {
    setCourier(order?.shipping_courier?.toLowerCase() || "jne");
    setTrackingNumber(order?.shipment?.tracking_number || "");
    setTrackingModalOpen(true);
  };

  const handleSaveTracking = async () => {
    if (!order || !trackingNumber.trim()) return;
    await inputTrackingMutation.mutateAsync({
      id: order.id,
      data: {
        courier: courier,
        tracking_number: trackingNumber.trim(),
      },
    });
    setTrackingModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 mb-1">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mb-6">
          ID pesanan tidak valid atau data telah terhapus dari sistem.
        </p>
        <Button asChild variant="outline" className="rounded-full text-xs">
          <Link href="/admin/orders">Kembali ke Daftar Pesanan</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="w-9 h-9 rounded-full border-slate-200">
            <Link href="/admin/orders">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                {order.order_number}
              </h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  statusBadgeColor[order.status] || "bg-slate-100 text-slate-800"
                }`}
              >
                {statusLabel[order.status] || order.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dibuat pada {formatDate(order.created_at)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleOpenTrackingModal}
            className="rounded-full text-xs border-slate-200 gap-1.5"
          >
            <Truck className="w-3.5 h-3.5 text-primary" />
            {order.shipment?.tracking_number ? "Update Resi" : "Input Resi"}
          </Button>
          <Button
            size="sm"
            onClick={handleOpenStatusModal}
            className="rounded-full text-xs bg-primary hover:bg-rose-600 text-white gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            Ubah Status
          </Button>
        </div>
      </div>

      {/* Main Grid: Detail Kiri & Ringkasan Kanan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Produk & Pengiriman */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daftar Barang */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Item Belanja ({order.items?.length || 0} Barang)
            </h2>

            <div className="divide-y divide-slate-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800">{item.nama_produk}</h3>
                    <p className="text-[11px] text-slate-400">
                      {item.quantity} × {formatRupiah(item.harga_satuan)}
                    </p>
                  </div>
                  <div className="text-right font-bold text-xs text-slate-800">
                    {formatRupiah(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal Calculation */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal Produk</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Diskon Voucher ({order.voucher_code || "Promo"})</span>
                  <span>- {formatRupiah(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Ongkos Kirim ({order.shipping_courier.toUpperCase()})</span>
                <span>{formatRupiah(order.shipping_cost)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-800 pt-2 border-t border-slate-100">
                <span>Total Tagihan</span>
                <span className="text-primary">{formatRupiah(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Pengiriman & Kurir */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              Informasi Logistik & Pengiriman
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Layanan Kurir</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block uppercase">
                  {order.shipping_courier} — {order.shipping_service}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Biteship Logistics Gateway
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 font-medium block text-[10px] uppercase">Nomor Resi</span>
                {order.shipment?.tracking_number ? (
                  <span className="font-bold text-primary text-sm mt-0.5 block font-mono">
                    {order.shipment.tracking_number}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs italic mt-1 block">Belum ada nomor resi</span>
                )}
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Status: {order.shipment?.status || "Menunggu pengiriman"}
                </span>
              </div>
            </div>

            {order.customer_notes && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-xs text-amber-900">
                <span className="font-bold block mb-0.5">Catatan Pembeli:</span>
                {order.customer_notes}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Pelanggan & Pembayaran */}
        <div className="space-y-6">
          {/* Penerima & Alamat */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Alamat Pengiriman
            </h2>
            <div className="text-xs space-y-1 text-slate-600">
              <p className="font-bold text-slate-800 text-sm">{order.shipping_recipient_name}</p>
              <p className="text-slate-500">{order.shipping_phone}</p>
              <p className="mt-2 text-slate-700 leading-relaxed">{order.shipping_address}</p>
              <p className="font-medium text-slate-800">{order.shipping_city}</p>
            </div>
          </div>

          {/* Status Pembayaran Mayar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Status Pembayaran
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Metode</span>
                <span className="font-semibold text-slate-800">
                  {order.payment?.payment_method || "Mayar Payment Gateway"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status</span>
                <Badge
                  variant="outline"
                  className={
                    order.payment?.status === "paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }
                >
                  {order.payment?.status || "pending"}
                </Badge>
              </div>
              {order.payment?.paid_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Bayar</span>
                  <span className="text-slate-700">{formatDate(order.payment.paid_at)}</span>
                </div>
              )}
              {order.payment?.mayar_payment_url && (
                <div className="pt-2">
                  <Button asChild variant="outline" size="sm" className="w-full text-xs rounded-xl">
                    <a href={order.payment.mayar_payment_url} target="_blank" rel="noreferrer">
                      Buka Invoice Mayar
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ubah Status Pesanan */}
      <Dialog open={statusModalOpen} onOpenChange={setStatusModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              Ubah Status Pesanan
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Pilih Status Baru
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="pending">Menunggu Pembayaran (pending)</option>
                <option value="paid">Sudah Dibayar (paid)</option>
                <option value="processing">Sedang Diproses (processing)</option>
                <option value="shipped">Sedang Dikirim (shipped)</option>
                <option value="delivered">Sampai Tujuan (delivered)</option>
                <option value="completed">Pesanan Selesai (completed)</option>
                <option value="cancelled">Batalkan Pesanan (cancelled)</option>
                <option value="refunded">Kembalikan Dana (refunded)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Catatan Internal (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Catatan alasan perubahan status pesanan..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(false)} className="rounded-full">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSaveStatus}
              disabled={updateStatusMutation.isPending}
              className="rounded-full bg-primary hover:bg-rose-600 text-white"
            >
              {updateStatusMutation.isPending ? "Menyimpan..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Input Nomor Resi */}
      <Dialog open={trackingModalOpen} onOpenChange={setTrackingModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              Input Resi Kurir Pengiriman
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Ekspedisi Kurir
              </label>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="jne">JNE Express</option>
                <option value="sicepat">SiCepat Ekspres</option>
                <option value="jnt">J&T Express</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Nomor Resi (Tracking Number)
              </label>
              <Input
                placeholder="Contoh: JNE0123456789"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="h-10 rounded-xl bg-slate-50 border-slate-200 text-xs focus-visible:ring-primary font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Menginput nomor resi akan otomatis mengubah status pesanan menjadi &apos;shipped&apos;.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTrackingModalOpen(false)} className="rounded-full">
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSaveTracking}
              disabled={inputTrackingMutation.isPending || !trackingNumber.trim()}
              className="rounded-full bg-primary hover:bg-rose-600 text-white"
            >
              {inputTrackingMutation.isPending ? "Menyimpan..." : "Simpan Resi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
