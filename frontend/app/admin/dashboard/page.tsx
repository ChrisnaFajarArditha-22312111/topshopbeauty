"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah, formatDate } from "@/lib/utils";
import { useAdminDashboardStats } from "@/features/admin/useAdmin";

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  paid: "Dibayar",
  processing: "Diproses",
  shipped: "Dikirim",
  delivered: "Terkirim",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  refunded: "Refund",
};

const statusColor: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-violet-100 text-violet-800 border-violet-200",
  shipped: "bg-cyan-100 text-cyan-800 border-cyan-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
  refunded: "bg-slate-100 text-slate-800 border-slate-200",
};

export default function AdminDashboardPage() {
  const { data: stats, isLoading, isError, refetch, isFetching } = useAdminDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Gagal Memuat Statistik</h2>
        <p className="text-sm text-slate-500 mb-6">
          Terjadi kendala saat menghubungkan ke server dashboard. Silakan coba muat ulang data.
        </p>
        <Button onClick={() => refetch()} className="rounded-full bg-primary hover:bg-rose-600 text-white gap-2">
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  const maxChartValue = Math.max(
    ...(stats.sales_chart?.map((d) => d.total_sales) || [0]),
    1
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            Dashboard Overview
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-primary font-semibold">
              Live Toko
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau performa penjualan, pesanan masuk, dan kesehatan katalog Topshop Kosmetik.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-full gap-2 border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Perbarui
          </Button>
          <Button asChild size="sm" className="rounded-full bg-primary hover:bg-rose-600 text-white gap-2 shadow-sm">
            <Link href="/admin/products">
              <Package className="w-4 h-4" />
              Kelola Produk
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Kartu KPI Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Omset Penjualan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-pink-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Omset</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">
            {formatRupiah(stats.total_penjualan || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pesanan terkonfirmasi & lunas</span>
          </div>
        </div>

        {/* KPI 2: Total Pesanan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-pink-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Pesanan</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.total_order || 0}</div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span className="text-amber-600 font-medium">{stats.pesanan_pending || 0} pending</span>
            <span className="text-emerald-600 font-medium">{stats.pesanan_selesai || 0} selesai</span>
          </div>
        </div>

        {/* KPI 3: Total Pelanggan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-pink-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pelanggan</span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.total_customer || 0}</div>
          <div className="text-xs text-slate-500 mt-2">Akun terdaftar di sistem</div>
        </div>

        {/* KPI 4: Total Produk */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-pink-200 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Katalog Produk</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-primary flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.total_produk || 0}</div>
          <div className="text-xs text-slate-500 mt-2">
            <span className="text-rose-500 font-semibold">{stats.low_stock_products?.length || 0} stok tipis</span>
          </div>
        </div>
      </div>

      {/* Bar Chart 7 Hari & Produk Stok Tipis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grafik Penjualan 7 Hari */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Tren Penjualan 7 Hari Terakhir
              </h2>
              <span className="text-xs text-slate-400">Omset Harian (IDR)</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Visualisasi volume penjualan dan pesanan yang masuk dalam sepekan terakhir.
            </p>
          </div>

          {stats.sales_chart && stats.sales_chart.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-end gap-3 h-48 pt-6 pb-2 border-b border-slate-100">
                {stats.sales_chart.map((point, index) => {
                  const heightPercent = Math.max((point.total_sales / maxChartValue) * 100, 4);
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-md">
                        {formatRupiah(point.total_sales)} • {point.order_count} order
                      </div>

                      {/* Bar */}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-primary/80 to-primary group-hover:from-rose-600 group-hover:to-rose-500 transition-all duration-300 shadow-xs"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                {stats.sales_chart.map((point, index) => (
                  <span key={index} className="flex-1 text-center truncate px-0.5">
                    {point.date.slice(5)}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400">
              Belum ada data penjualan 7 hari terakhir
            </div>
          )}
        </div>

        {/* Peringatan Stok Menipis */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Peringatan Stok Tipis
            </h2>
            <Link href="/admin/products" className="text-xs font-semibold text-primary hover:underline">
              Semua
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {stats.low_stock_products && stats.low_stock_products.length > 0 ? (
              stats.low_stock_products.map((item, idx) => {
                const prodId = item.product_id || item.id || `low-${idx}`;
                return (
                  <div
                    key={prodId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-200 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 overflow-hidden relative shrink-0">
                        {item.foto_utama ? (
                          <Image src={item.foto_utama} alt={item.nama_produk} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-slate-800 truncate">{item.nama_produk}</h3>
                        <p className="text-[11px] text-slate-400">ID: {String(prodId).slice(0, 8)}...</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 font-bold shrink-0 ml-2">
                      Sisa {item.stok}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                <p className="text-xs font-medium text-slate-600">Semua Stok Aman</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada produk dengan stok di bawah 10 unit</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid Bawah: Pesanan Terbaru & Produk Terlaris */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabel 5 Pesanan Terbaru */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Pesanan Masuk Terbaru
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Pantau status transaksi dan pengiriman terkini</p>
            </div>
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-rose-600 gap-1 text-xs">
              <Link href="/admin/orders">
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-3 px-3">No. Order</th>
                  <th className="py-3 px-3">Pelanggan</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recent_orders && stats.recent_orders.length > 0 ? (
                  stats.recent_orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-800">{order.order_number}</td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">{order.customer_name || order.customer_email || "Pelanggan"}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{formatRupiah(order.total_amount)}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            statusColor[order.status] || "bg-slate-100 text-slate-800 border-slate-200"
                          }`}
                        >
                          {statusLabel[order.status] || order.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{formatDate(order.created_at)}</td>
                      <td className="py-3 px-3 text-right">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary px-2">
                          <Link href={`/admin/orders/${order.id}`}>Detail</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada pesanan terbaru
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Produk Terlaris */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Produk Terlaris
            </h2>
            <span className="text-xs text-slate-400">Top Selling</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {stats.top_selling_products && stats.top_selling_products.length > 0 ? (
              stats.top_selling_products.map((prod, index) => {
                const prodId = prod.product_id || prod.id || `top-${index}`;
                return (
                  <div key={prodId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="w-7 text-center font-bold text-xs text-slate-400">#{index + 1}</div>
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
                      {prod.foto_utama ? (
                        <Image src={prod.foto_utama} alt={prod.nama_produk} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Package className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-semibold text-slate-800 truncate">{prod.nama_produk}</h3>
                      <p className="text-[11px] text-slate-400">{formatRupiah(prod.harga)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-800 block">{prod.terjual} terjual</span>
                      <span className="text-[10px] text-emerald-600 block">{formatRupiah(prod.total_omset || (prod.harga * prod.terjual))}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                Belum ada data produk terjual
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
