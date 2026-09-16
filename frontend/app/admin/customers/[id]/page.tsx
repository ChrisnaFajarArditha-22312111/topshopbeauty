"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShoppingBag,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminCustomerDetail,
  useUpdateCustomerStatus,
} from "@/features/admin/useAdmin";
import { formatRupiah, formatDate } from "@/lib/utils";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: customer, isLoading, isError, refetch } = useAdminCustomerDetail(userId);
  const updateStatusMutation = useUpdateCustomerStatus();

  const handleToggleActive = async () => {
    if (!customer) return;
    await updateStatusMutation.mutateAsync({
      id: customer.id,
      data: {
        is_active: !customer.is_active,
      },
    });
  };

  const handleToggleAdmin = async () => {
    if (!customer) return;
    await updateStatusMutation.mutateAsync({
      id: customer.id,
      data: {
        is_active: customer.is_active,
        is_admin: !customer.is_admin,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 rounded-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="lg:col-span-2 h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 mb-1">Pelanggan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mb-6">
          ID pengguna tidak terdaftar di sistem.
        </p>
        <Button asChild variant="outline" className="rounded-full text-xs">
          <Link href="/admin/customers">Kembali ke Daftar Pelanggan</Link>
        </Button>
      </div>
    );
  }

  const profile = customer.profile as {
    full_name?: string | null;
    phone?: string | null;
    bio?: string | null;
    gender?: string | null;
    date_of_birth?: string | null;
  } | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="w-9 h-9 rounded-full border-slate-200">
            <Link href="/admin/customers">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                {profile?.full_name || customer.email}
              </h1>
              <Badge
                variant="outline"
                className={
                  customer.is_active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }
              >
                {customer.is_active ? "Akun Aktif" : "Dinonaktifkan"}
              </Badge>
              {customer.is_admin && (
                <Badge className="bg-rose-100 text-primary border-rose-200">Admin</Badge>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ID: {customer.id} • Terdaftar {formatDate(customer.created_at)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleAdmin}
            disabled={updateStatusMutation.isPending}
            className="rounded-full text-xs border-slate-200"
          >
            {customer.is_admin ? "Cabut Hak Admin" : "Jadikan Admin"}
          </Button>
          <Button
            size="sm"
            onClick={handleToggleActive}
            disabled={updateStatusMutation.isPending}
            className={`rounded-full text-xs ${
              customer.is_active
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {customer.is_active ? "Nonaktifkan Akun" : "Aktifkan Akun"}
          </Button>
        </div>
      </div>

      {/* Grid Profil & Ringkasan Transaksi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profil Akun */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-4 h-4 text-primary" />
            Informasi Pribadi
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Email</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {customer.email}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Nomor HP</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {profile?.phone || "-"}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Buku Alamat</span>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {customer.addresses_count || 0} Alamat Tersimpan
              </span>
            </div>

            {profile?.gender && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Jenis Kelamin</span>
                <span className="font-medium text-slate-700 mt-0.5 block">{profile.gender}</span>
              </div>
            )}

            {profile?.bio && (
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Bio</span>
                <p className="text-slate-600 mt-0.5 italic">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Statistik Belanja & Riwayat Transaksi */}
        <div className="lg:col-span-2 space-y-6">
          {/* Metrik Belanja */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Transaksi Selesai</span>
              <div className="text-xl font-bold text-slate-800 mt-1">
                {customer.orders?.length || 0} Pesanan
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <span className="text-xs font-medium text-slate-500">Total Akumulasi Belanja</span>
              <div className="text-xl font-bold text-primary mt-1">
                {formatRupiah(customer.total_spend || 0)}
              </div>
            </div>
          </div>

          {/* Riwayat Order Pengguna */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              Riwayat Pesanan Pelanggan
            </h2>

            {customer.orders && customer.orders.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {customer.orders.map((ord) => (
                  <div key={ord.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <Link
                        href={`/admin/orders/${ord.id}`}
                        className="font-bold text-slate-800 hover:text-primary transition-colors block"
                      >
                        {ord.order_number}
                      </Link>
                      <span className="text-[11px] text-slate-400">{formatDate(ord.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-800">{formatRupiah(ord.total_amount)}</span>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {ord.status}
                      </Badge>
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs text-primary px-2">
                        <Link href={`/admin/orders/${ord.id}`}>Lihat</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Pelanggan ini belum pernah melakukan pemesanan.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
