"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Filter,
  Eye,
  RefreshCw,
  Search,
  CheckCircle,
  Truck,
  XCircle,
  Clock,
  ArrowUpDown,
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
import { useAdminOrders, useUpdateOrderStatus } from "@/features/admin/useAdmin";
import { OrderStatus } from "@/features/admin/adminTypes";
import { formatRupiah, formatDate } from "@/lib/utils";

const STATUS_TABS = [
  { key: "all", label: "Semua Status" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Dibayar" },
  { key: "processing", label: "Diproses" },
  { key: "shipped", label: "Dikirim" },
  { key: "completed", label: "Selesai" },
  { key: "cancelled", label: "Dibatalkan" },
];

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

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<{ id: string; currentStatus: string } | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("processing");
  const [statusNotes, setStatusNotes] = useState("");

  const { data: orders, isLoading, isError, refetch, isFetching } = useAdminOrders(activeTab);
  const updateStatusMutation = useUpdateOrderStatus();

  const handleOpenStatusModal = (id: string, currentStatus: string) => {
    setSelectedOrder({ id, currentStatus });
    setNewStatus((currentStatus as OrderStatus) || "processing");
    setStatusNotes("");
  };

  const handleSaveStatus = async () => {
    if (!selectedOrder) return;
    await updateStatusMutation.mutateAsync({
      id: selectedOrder.id,
      data: {
        status: newStatus,
        notes: statusNotes ? statusNotes : undefined,
      },
    });
    setSelectedOrder(null);
  };

  const filteredOrders = orders?.filter((ord) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      ord.order_number.toLowerCase().includes(q) ||
      ord.shipping_recipient_name.toLowerCase().includes(q) ||
      ord.shipping_phone.toLowerCase().includes(q) ||
      (ord.voucher_code && ord.voucher_code.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            Manajemen Pesanan
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
              {orders?.length || 0} Order
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola proses pemesanan, verifikasi pembayaran, kurir Biteship, dan perbarui status transaksi.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-full gap-2 border-slate-200 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh Data
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari no. order, nama penerima, atau nomor HP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm">Gagal memuat daftar pesanan toko.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3 rounded-full">
              Coba Lagi
            </Button>
          </div>
        ) : filteredOrders && filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">No. Order</th>
                  <th className="py-3.5 px-4 font-bold">Penerima & Alamat</th>
                  <th className="py-3.5 px-4 font-bold">Kurir</th>
                  <th className="py-3.5 px-4 font-bold">Total Belanja</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold">Tanggal</th>
                  <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-primary transition-colors">
                        {order.order_number}
                      </Link>
                      <span className="block text-[11px] text-slate-400 font-normal">
                        {order.items?.length || 0} barang
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block truncate max-w-[160px]">
                        {order.shipping_recipient_name}
                      </span>
                      <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                        {order.shipping_city} • {order.shipping_phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700 uppercase block">
                        {order.shipping_courier}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{order.shipping_service}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {formatRupiah(order.total_amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          statusBadgeColor[order.status] || "bg-slate-100 text-slate-800"
                        }`}
                      >
                        {statusLabel[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(order.created_at)}</td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenStatusModal(order.id, order.status)}
                        className="h-7 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        Status
                      </Button>
                      <Button asChild size="sm" className="h-7 text-xs rounded-lg bg-primary hover:bg-rose-600 text-white">
                        <Link href={`/admin/orders/${order.id}`}>Detail</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada pesanan ditemukan</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Coba ubah filter status atau kata kunci pencarian Anda.
            </p>
          </div>
        )}
      </div>

      {/* Modal Ubah Status Pesanan */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800">
              Perbarui Status Pesanan
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
                Catatan Status (Opsional)
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Paket diserahkan ke kurir JNE cabang Lampung..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedOrder(null)}
              className="rounded-full"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSaveStatus}
              disabled={updateStatusMutation.isPending}
              className="rounded-full bg-primary hover:bg-rose-600 text-white"
            >
              {updateStatusMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
