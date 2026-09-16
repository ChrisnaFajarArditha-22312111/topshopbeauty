"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  ShieldCheck,
  ShieldAlert,
  Eye,
  RefreshCw,
  ShoppingBag,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminCustomers, useUpdateCustomerStatus } from "@/features/admin/useAdmin";
import { formatRupiah, formatDate } from "@/lib/utils";

export default function AdminCustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: customers, isLoading, isError, refetch, isFetching } = useAdminCustomers();
  const updateStatusMutation = useUpdateCustomerStatus();

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    await updateStatusMutation.mutateAsync({
      id: userId,
      data: {
        is_active: !currentActive,
      },
    });
  };

  const filteredCustomers = customers?.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.full_name && c.full_name.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            Manajemen Pelanggan
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 font-semibold">
              {customers?.length || 0} Pengguna
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lihat daftar akun pelanggan terdaftar, total transaksi belanja, dan kelola status akses pengguna.
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

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari email, nama pelanggan, atau nomor telepon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm">Gagal memuat data pelanggan.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3 rounded-full">
              Coba Lagi
            </Button>
          </div>
        ) : filteredCustomers && filteredCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Pelanggan</th>
                  <th className="py-3.5 px-4 font-bold">Kontak</th>
                  <th className="py-3.5 px-4 font-bold">Role</th>
                  <th className="py-3.5 px-4 font-bold">Total Belanja</th>
                  <th className="py-3.5 px-4 font-bold">Status Akun</th>
                  <th className="py-3.5 px-4 font-bold">Terdaftar</th>
                  <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center shrink-0">
                          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/customers/${user.id}`}
                            className="font-semibold text-slate-800 hover:text-primary transition-colors block truncate max-w-[160px]"
                          >
                            {user.full_name || "Tanpa Nama"}
                          </Link>
                          <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {user.phone ? (
                        <span className="block">{user.phone}</span>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                      {user.email_verified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <CheckCircle className="w-3 h-3" /> Email Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                          <XCircle className="w-3 h-3" /> Belum Verifikasi
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {user.is_admin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-primary border border-rose-200">
                          <ShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          Customer
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-800 block">
                        {formatRupiah(user.total_spend || 0)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        {user.total_orders || 0} kali transaksi
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        disabled={updateStatusMutation.isPending}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all border ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-rose-500"}`}
                        />
                        {user.is_active ? "Aktif" : "Non-aktif"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(user.created_at)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-primary px-2">
                        <Link href={`/admin/customers/${user.id}`}>Detail</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada pelanggan ditemukan</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Coba gunakan kata kunci pencarian yang berbeda.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
