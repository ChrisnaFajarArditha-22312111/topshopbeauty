"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  Star,
  CheckCircle2,
  Filter,
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
import api from "@/lib/axios";
import {
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useAdminCategories,
  useAdminBrands,
  useAdminSkinTypes,
  useAdminSkinConcerns,
} from "@/features/admin/useAdmin";
import { AdminProductCreate } from "@/features/admin/adminTypes";
import { Product, PaginatedProducts } from "@/features/products/productTypes";
import { formatRupiah } from "@/lib/utils";

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form Fields
  const [namaProduk, setNamaProduk] = useState("");
  const [harga, setHarga] = useState<number>(0);
  const [hargaAsli, setHargaAsli] = useState<number | undefined>(undefined);
  const [diskonPersen, setDiskonPersen] = useState("");
  const [stok, setStok] = useState<number>(10);
  const [fotoUtama, setFotoUtama] = useState("");
  const [urlProduk, setUrlProduk] = useState("");
  const [isSkincare, setIsSkincare] = useState(true);
  const [usageTime, setUsageTime] = useState("Pagi & Malam");
  const [texture, setTexture] = useState("Cream / Gel");
  const [searchDoc, setSearchDoc] = useState("");

  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [selectedSkinConcerns, setSelectedSkinConcerns] = useState<string[]>([]);

  // Fetch Products
  const {
    data: productsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["products", "admin", categoryFilter],
    queryFn: async () => {
      const url =
        categoryFilter && categoryFilter !== "all"
          ? `/products?category=${encodeURIComponent(categoryFilter)}&page_size=100`
          : `/products?page_size=100`;
      const response = await api.get<PaginatedProducts>(url);
      return response.data;
    },
  });

  // Master Data Queries
  const { data: categories } = useAdminCategories();
  const { data: brands } = useAdminBrands();
  const { data: skinTypes } = useAdminSkinTypes();
  const { data: skinConcerns } = useAdminSkinConcerns();

  // Mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const handleOpenCreateModal = () => {
    setEditingProductId(null);
    setNamaProduk("");
    setHarga(0);
    setHargaAsli(undefined);
    setDiskonPersen("");
    setStok(10);
    setFotoUtama("");
    setUrlProduk("");
    setIsSkincare(true);
    setUsageTime("Pagi & Malam");
    setTexture("Cream / Gel");
    setSearchDoc("");
    setBrandId("");
    setCategoryId("");
    setSubCategoryId("");
    setSelectedSkinTypes([]);
    setSelectedSkinConcerns([]);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProductId(p.id);
    setNamaProduk(p.nama_produk);
    setHarga(p.harga);
    setHargaAsli(p.harga_asli || undefined);
    setDiskonPersen(p.diskon_persen || "");
    setStok(p.stok);
    setFotoUtama(p.foto_utama || "");
    setIsSkincare(p.is_skincare);
    setUsageTime(p.usage_time || "Pagi & Malam");
    setTexture(p.texture || "Cream / Gel");
    setFormModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaProduk.trim() || harga <= 0) return;

    const payload: AdminProductCreate = {
      nama_produk: namaProduk.trim(),
      harga: Number(harga),
      harga_asli: hargaAsli ? Number(hargaAsli) : undefined,
      diskon_persen: diskonPersen ? diskonPersen : undefined,
      stok: Number(stok) || 0,
      foto_utama: fotoUtama.trim() || undefined,
      url_produk: urlProduk.trim() || undefined,
      is_skincare: isSkincare,
      usage_time: usageTime.trim() || undefined,
      texture: texture.trim() || undefined,
      search_document: searchDoc.trim() || undefined,
      brand_id: brandId || undefined,
      category_id: categoryId || undefined,
      sub_category_id: subCategoryId || undefined,
      skin_type_ids: selectedSkinTypes.length > 0 ? selectedSkinTypes : undefined,
      skin_concern_ids: selectedSkinConcerns.length > 0 ? selectedSkinConcerns : undefined,
    };

    if (editingProductId) {
      await updateProductMutation.mutateAsync({
        id: editingProductId,
        data: payload,
      });
    } else {
      await createProductMutation.mutateAsync(payload);
    }

    setFormModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    await deleteProductMutation.mutateAsync(deleteTargetId);
    setDeleteTargetId(null);
  };

  const toggleSkinType = (id: string) => {
    setSelectedSkinTypes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSkinConcern = (id: string) => {
    setSelectedSkinConcerns((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredProducts = productsData?.items?.filter((prod) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      prod.nama_produk.toLowerCase().includes(q) ||
      (prod.brand_name && prod.brand_name.toLowerCase().includes(q))
    );
  });

  const isSaving = createProductMutation.isPending || updateProductMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            Manajemen Produk
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-100 text-primary font-semibold">
              {productsData?.total || 0} Produk
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tambah produk baru, perbarui data kecantikan, sesuaikan harga, dan monitor sisa stok.
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
            onClick={handleOpenCreateModal}
            className="rounded-full bg-primary hover:bg-rose-600 text-white gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Cari nama produk kosmetik atau brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs focus-visible:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-primary w-full sm:w-auto"
          >
            <option value="all">Semua Kategori</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-sm">Gagal memuat katalog produk.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3 rounded-full">
              Coba Lagi
            </Button>
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Produk</th>
                  <th className="py-3.5 px-4 font-bold">Kategori & Brand</th>
                  <th className="py-3.5 px-4 font-bold">Harga Jual</th>
                  <th className="py-3.5 px-4 font-bold">Stok</th>
                  <th className="py-3.5 px-4 font-bold">Performa</th>
                  <th className="py-3.5 px-4 font-bold">Tipe</th>
                  <th className="py-3.5 px-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
                          {p.foto_utama ? (
                            <Image src={p.foto_utama} alt={p.nama_produk} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 block truncate max-w-[200px]">
                            {p.nama_produk}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            ID: {p.id.slice(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-700 block">{p.brand_name || "Tanpa Brand"}</span>
                      <span className="text-[10px] text-slate-400 block">{p.category_name || "Umum"}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block">{formatRupiah(p.harga)}</span>
                      {p.harga_asli && p.harga_asli > p.harga && (
                        <span className="text-[10px] text-slate-400 line-through block">
                          {formatRupiah(p.harga_asli)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={
                          p.stok <= 5
                            ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                            : p.stok <= 15
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }
                      >
                        {p.stok} unit
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="font-bold">{p.rating?.toFixed(1) || "5.0"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">{p.terjual || 0} terjual</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px] bg-slate-50">
                        {p.is_skincare ? "Skincare" : "Kosmetik"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEditModal(p)}
                        className="h-7 w-7 text-slate-600 hover:text-primary"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTargetId(p.id)}
                        className="h-7 w-7 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400">
            <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada produk ditemukan</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Coba sesuaikan kata kunci pencarian atau filter kategori.
            </p>
          </div>
        )}
      </div>

      {/* Modal Form Produk (Tambah & Edit) */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border border-slate-100 shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 pr-12 shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {editingProductId ? "Edit Data Produk" : "Tambah Produk Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs overscroll-contain">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Produk *</label>
              <Input
                required
                placeholder="Contoh: Garnier Bright Complete Vitamin C Serum..."
                value={namaProduk}
                onChange={(e) => setNamaProduk(e.target.value)}
                className="text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Harga Jual (Rp) *</label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={harga}
                  onChange={(e) => setHarga(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Harga Asli / Coret (Rp)</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="Opsional jika promo"
                  value={hargaAsli || ""}
                  onChange={(e) => setHargaAsli(e.target.value ? Number(e.target.value) : undefined)}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Stok Awal *</label>
                <Input
                  type="number"
                  required
                  min={0}
                  value={stok}
                  onChange={(e) => setStok(Number(e.target.value))}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Brand</label>
                <select
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Pilih Brand --</option>
                  {brands?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kategori</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">URL Foto Utama</label>
              <Input
                placeholder="https://images.unsplash.com/..."
                value={fotoUtama}
                onChange={(e) => setFotoUtama(e.target.value)}
                className="text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Waktu Pakai</label>
                <Input
                  placeholder="Pagi & Malam / Pagi Saja"
                  value={usageTime}
                  onChange={(e) => setUsageTime(e.target.value)}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Tekstur Produk</label>
                <Input
                  placeholder="Serum / Liquid / Cream / Gel"
                  value={texture}
                  onChange={(e) => setTexture(e.target.value)}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            </div>

            {/* Checklist Skin Types */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Kecocokan Jenis Kulit (Skin Types)
              </label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                {skinTypes?.map((st) => {
                  const isChecked = selectedSkinTypes.includes(st.id);
                  return (
                    <button
                      type="button"
                      key={st.id}
                      onClick={() => toggleSkinType(st.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isChecked
                          ? "bg-primary text-white font-semibold"
                          : "bg-white text-slate-700 border border-slate-200 hover:border-pink-200"
                      }`}
                    >
                      {st.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checklist Skin Concerns */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Solusi Masalah Kulit (Skin Concerns)
              </label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                {skinConcerns?.map((sc) => {
                  const isChecked = selectedSkinConcerns.includes(sc.id);
                  return (
                    <button
                      type="button"
                      key={sc.id}
                      onClick={() => toggleSkinConcern(sc.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        isChecked
                          ? "bg-primary text-white font-semibold"
                          : "bg-white text-slate-700 border border-slate-200 hover:border-pink-200"
                      }`}
                    >
                      {sc.name}
                    </button>
                  );
                })}
              </div>
            </div>

            </div>

            <DialogFooter className="p-4 sm:p-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormModalOpen(false)}
                className="rounded-full"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="rounded-full bg-primary hover:bg-rose-600 text-white"
              >
                {isSaving ? "Menyimpan..." : "Simpan Produk"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <Dialog open={!!deleteTargetId} onOpenChange={() => setDeleteTargetId(null)}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Hapus Produk dari Katalog?
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-600 leading-relaxed py-2">
            Produk akan dihapus permanen dari database katalog toko dan tidak lagi dapat dicari
            oleh pelanggan atau direkomendasikan oleh AI Beauty Advisor.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTargetId(null)}
              className="rounded-full"
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleDelete}
              disabled={deleteProductMutation.isPending}
              className="rounded-full bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteProductMutation.isPending ? "Menghapus..." : "Ya, Hapus Produk"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
