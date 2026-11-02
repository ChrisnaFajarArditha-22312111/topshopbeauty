"use client";

import React, { useState } from "react";
import {
  Ticket,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Percent,
  Coins,
  Calendar,
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
import { useAdminVouchers, useCreateVoucher, useToggleVoucher } from "@/features/admin/useAdmin";
import { AdminVoucherCreate } from "@/features/admin/adminTypes";
import { formatRupiah, formatDate } from "@/lib/utils";

export default function AdminPromotionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountAmount, setDiscountAmount] = useState<number>(10);
  const [minPurchase, setMinPurchase] = useState<number>(50000);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(20000);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [usageLimit, setUsageLimit] = useState<number>(100);

  const { data: vouchers, isLoading, isError, refetch, isFetching } = useAdminVouchers();
  const createVoucherMutation = useCreateVoucher();
  const toggleVoucherMutation = useToggleVoucher();

  const handleToggle = async (voucherId: string, currentActive: boolean) => {
    await toggleVoucherMutation.mutateAsync({
      id: voucherId,
      isActive: !currentActive,
    });
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    const payload: AdminVoucherCreate = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description.trim() || undefined,
      discount_type: discountType,
      discount_amount: Number(discountAmount),
      min_purchase: Number(minPurchase) || 0,
      max_discount: discountType === "percentage" && maxDiscount ? Number(maxDiscount) : undefined,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      usage_limit: Number(usageLimit) || 100,
      is_active: true,
    };

    await createVoucherMutation.mutateAsync(payload);
    setCreateModalOpen(false);

    // Reset Form
    setCode("");
    setName("");
    setDescription("");
    setDiscountAmount(10);
  };

  const filteredVouchers = vouchers?.filter((v) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return v.code.toLowerCase().includes(q) || v.name.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            Voucher & Promosi
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-primary font-semibold">
              {vouchers?.length || 0} Kode Promo
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola kupon diskon toko, kuota batas pemakaian voucher, dan masa berlaku kampanye promosi.
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
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="rounded-full bg-primary hover:bg-rose-600 text-white gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Buat Voucher Baru
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari kode kupon voucher atau nama promosi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs focus-visible:ring-primary"
          />
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm">Gagal memuat daftar voucher promosi.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3 rounded-full">
              Coba Lagi
            </Button>
          </div>
        ) : filteredVouchers && filteredVouchers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Kode Kupon</th>
                  <th className="py-3.5 px-4 font-bold">Nama Promosi</th>
                  <th className="py-3.5 px-4 font-bold">Potongan Diskon</th>
                  <th className="py-3.5 px-4 font-bold">Min. Belanja</th>
                  <th className="py-3.5 px-4 font-bold">Pemakaian</th>
                  <th className="py-3.5 px-4 font-bold">Periode Berlaku</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-primary font-mono tracking-wider">
                      {v.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{v.name}</span>
                      {v.description && (
                        <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                          {v.description}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {v.discount_type === "percentage" ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                          <Percent className="w-3.5 h-3.5" />
                          {v.discount_amount}% OFF
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                          <Coins className="w-3.5 h-3.5" />
                          {formatRupiah(v.discount_amount)}
                        </span>
                      )}
                      {v.max_discount && (
                        <span className="text-[10px] text-slate-400 block">
                          Maks. {formatRupiah(v.max_discount)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {formatRupiah(v.min_purchase)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-semibold">{v.used_count || 0}</span>
                      <span className="text-slate-400"> / {v.usage_limit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <span className="block">{formatDate(v.start_date)}</span>
                      <span className="text-[10px] text-slate-400 block">s/d {formatDate(v.end_date)}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant="outline"
                        className={
                          v.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }
                      >
                        {v.is_active ? "Aktif" : "Non-aktif"}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant={v.is_active ? "outline" : "default"}
                        onClick={() => handleToggle(v.id, v.is_active)}
                        disabled={toggleVoucherMutation.isPending}
                        className={`h-7 text-xs rounded-lg ${
                          v.is_active
                            ? "border-slate-200 text-slate-600 hover:bg-slate-100"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                      >
                        {v.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Ticket className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Belum ada kupon voucher</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Buat kode promo pertama Anda untuk menarik minat pelanggan.
            </p>
          </div>
        )}
      </div>

      {/* Modal Buat Voucher Baru */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-lg bg-white rounded-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border border-slate-100 shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 pr-12 shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Buat Voucher Promosi Baru
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateVoucher} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs overscroll-contain">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kode Voucher *</label>
                <Input
                  required
                  placeholder="CONTOH: GLOWING20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="uppercase font-mono text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nama Promo *</label>
                <Input
                  required
                  placeholder="Promo Diskon Cantik"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Deskripsi Singkat</label>
              <Input
                placeholder="Diskon spesial pengguna pertama..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tipe Diskon</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-primary"
                >
                  <option value="percentage">Persentase (%)</option>
                  <option value="fixed">Nominal Tetap (Rp)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nilai Diskon {discountType === "percentage" ? "(%)" : "(Rp)"} *
                </label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Min. Pembelian (Rp)</label>
                <Input
                  type="number"
                  min={0}
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Maks. Diskon (Rp)</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Opsional jika persentase"
                  value={maxDiscount || ""}
                  onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tanggal Mulai *</label>
                <Input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tanggal Berakhir *</label>
                <Input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Batas Kuota Pemakaian</label>
              <Input
                type="number"
                min={1}
                value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                className="text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            </div>

            <DialogFooter className="p-4 sm:p-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-full"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createVoucherMutation.isPending}
                className="rounded-full bg-primary hover:bg-rose-600 text-white"
              >
                {createVoucherMutation.isPending ? "Menyimpan..." : "Simpan Voucher"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
