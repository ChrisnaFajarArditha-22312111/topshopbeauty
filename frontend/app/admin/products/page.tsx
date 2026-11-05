"use client";

import React, { useState, useEffect } from "react";
import { ProductImage } from "@/components/product/product-card";
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
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
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
import { Product, PaginatedProducts, ProductDetail } from "@/features/products/productTypes";
import { formatRupiah } from "@/lib/utils";
import ImageUploader from "@/components/admin/ImageUploader";
import MultiImageUploader from "@/components/admin/MultiImageUploader";
import { toast } from "sonner";

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query untuk server-side searching
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Modal State
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Form Fields
  const [namaProduk, setNamaProduk] = useState("");
  const [harga, setHarga] = useState<number | "">("");
  const [hargaAsli, setHargaAsli] = useState<number | "">("");
  const [diskonPersen, setDiskonPersen] = useState("");
  const [stok, setStok] = useState<number | "">(10);
  const [fotoUtama, setFotoUtama] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [urlProduk, setUrlProduk] = useState("");
  const [isSkincare, setIsSkincare] = useState(true);
  const [usageTime, setUsageTime] = useState("Pagi & Malam");
  const [texture, setTexture] = useState("Liquid / Serum");
  const [searchDoc, setSearchDoc] = useState("");

  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [selectedSkinConcerns, setSelectedSkinConcerns] = useState<string[]>([]);

  // Master Data Queries
  const { data: categories } = useAdminCategories();
  const { data: brands } = useAdminBrands();
  const { data: skinTypes } = useAdminSkinTypes();
  const { data: skinConcerns } = useAdminSkinConcerns();

  // Sub-kategori yang sesuai dengan kategori terpilih
  const activeCategory = categories?.find((c) => c.id === categoryId);
  const subCategories = activeCategory?.sub_categories || [];

  // Fetch Products dengan Pagination & Server-Side Search (Sort Terbaru)
  const {
    data: productsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["products", "admin", categoryFilter, currentPage, debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(currentPage));
      params.append("page_size", "20");
      params.append("sort_by", "terbaru");
      if (categoryFilter && categoryFilter !== "all") {
        params.append("category", categoryFilter);
      }
      if (debouncedSearch) {
        params.append("q", debouncedSearch);
      }
      const response = await api.get<PaginatedProducts>(`/products?${params.toString()}`);
      return response.data;
    },
  });

  // Mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const handleOpenCreateModal = () => {
    setEditingProductId(null);
    setNamaProduk("");
    setHarga("");
    setHargaAsli("");
    setDiskonPersen("");
    setStok(10);
    setFotoUtama("");
    setGalleryImages([]);
    setUrlProduk("");
    setIsSkincare(true);
    setUsageTime("Pagi & Malam");
    setTexture("Liquid / Serum");
    setSearchDoc("");
    setBrandId("");
    setCategoryId("");
    setSubCategoryId("");
    setSelectedSkinTypes([]);
    setSelectedSkinConcerns([]);
    setIsUploadingImage(false);
    setFormModalOpen(true);
  };

  const handleOpenEditModal = async (p: Product) => {
    setEditingProductId(p.id);
    setNamaProduk(p.nama_produk);
    setHarga(p.harga);
    setHargaAsli(p.harga_asli || "");
    setDiskonPersen(p.diskon_persen || "");
    setStok(p.stok);
    setFotoUtama(p.foto_utama || "");
    setIsSkincare(p.is_skincare);
    setUsageTime(p.usage_time || "Pagi & Malam");
    setTexture(p.texture || "Liquid / Serum");
    setIsUploadingImage(false);
    setFormModalOpen(true);

    // Load detail lengkap untuk relasi brand, category, skin types, dan skin concerns
    setIsLoadingDetail(true);
    try {
      const res = await api.get<ProductDetail>(`/products/${p.id}`);
      const detail = res.data;

      // Sinkronisasi ID Brand (utamakan ID langsung dari backend)
      if (detail.brand_id) {
        setBrandId(detail.brand_id);
      } else if (brands && detail.brand_name) {
        const foundBrand = brands.find((b) => b.name === detail.brand_name);
        if (foundBrand) setBrandId(foundBrand.id);
      }

      // Sinkronisasi ID Kategori
      if (detail.category_id) {
        setCategoryId(detail.category_id);
      } else if (categories && detail.category_name) {
        const foundCat = categories.find((c) => c.name === detail.category_name);
        if (foundCat) setCategoryId(foundCat.id);
      }

      // Sinkronisasi Sub-Kategori
      if (detail.sub_category_id) {
        setSubCategoryId(detail.sub_category_id);
      } else if (detail.sub_category_name && categories) {
        for (const cat of categories) {
          const foundSub = cat.sub_categories?.find((s) => s.name === detail.sub_category_name);
          if (foundSub) {
            setSubCategoryId(foundSub.id);
            break;
          }
        }
      }

      if (detail.images && detail.images.length > 0) {
        setGalleryImages(detail.images.map((img) => img.image_url));
      } else {
        setGalleryImages([]);
      }

      if (detail.skin_types && detail.skin_types.length > 0) {
        setSelectedSkinTypes(detail.skin_types.map((st) => st.id));
      } else {
        setSelectedSkinTypes([]);
      }

      if (detail.skin_concerns && detail.skin_concerns.length > 0) {
        setSelectedSkinConcerns(detail.skin_concerns.map((sc) => sc.id));
      } else {
        setSelectedSkinConcerns([]);
      }

      if (detail.usage_time) setUsageTime(detail.usage_time);
      if (detail.texture) setTexture(detail.texture);
    } catch {
      // Jika gagal memuat detail, form tetap bisa digunakan
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanNama = namaProduk.trim();
    if (!cleanNama) {
      toast.error("Nama produk tidak boleh kosong!");
      return;
    }

    const numHarga = typeof harga === "number" ? harga : Number(harga);
    if (!numHarga || numHarga <= 0) {
      toast.error("Harga jual harus lebih besar dari 0!");
      return;
    }

    const numHargaAsli = hargaAsli !== "" && hargaAsli !== undefined ? Number(hargaAsli) : undefined;
    if (numHargaAsli !== undefined && numHargaAsli < numHarga) {
      toast.error("Harga Asli (coret) tidak boleh lebih kecil dari harga jual!");
      return;
    }

    if (isUploadingImage || isUploadingGallery) {
      toast.warning("Harap tunggu hingga proses upload gambar selesai!");
      return;
    }

    const numStok = typeof stok === "number" ? Math.max(0, stok) : Math.max(0, Number(stok) || 0);

    // Hitung persentase diskon otomatis jika harga asli diisi
    let calculatedDiskonPersen: string | undefined = undefined;
    if (numHargaAsli && numHargaAsli > numHarga) {
      calculatedDiskonPersen = `${Math.round(((numHargaAsli - numHarga) / numHargaAsli) * 100)}%`;
    }

    const payload: AdminProductCreate = {
      nama_produk: cleanNama,
      harga: numHarga,
      harga_asli: numHargaAsli,
      diskon_persen: calculatedDiskonPersen,
      stok: numStok,
      foto_utama: fotoUtama.trim() || undefined,
      url_produk: urlProduk.trim() || undefined,
      is_skincare: isSkincare,
      usage_time: usageTime.trim() || undefined,
      texture: texture.trim() || undefined,
      search_document: searchDoc.trim() || undefined,
      brand_id: brandId.trim() ? brandId.trim() : undefined,
      category_id: categoryId.trim() ? categoryId.trim() : undefined,
      sub_category_id: subCategoryId.trim() ? subCategoryId.trim() : undefined,
      skin_type_ids: selectedSkinTypes.length > 0 ? selectedSkinTypes : undefined,
      skin_concern_ids: selectedSkinConcerns.length > 0 ? selectedSkinConcerns : undefined,
      image_urls: galleryImages,
    };

    try {
      if (editingProductId) {
        await updateProductMutation.mutateAsync({
          id: editingProductId,
          data: payload,
        });
      } else {
        await createProductMutation.mutateAsync(payload);
      }
      setFormModalOpen(false);
    } catch {
      // Toast notifikasi sukses & error sudah otomatis ditangani oleh useAdmin hook
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteProductMutation.mutateAsync(deleteTargetId);
      setDeleteTargetId(null);
    } catch {
      // Toast error sudah ditangani oleh useAdmin hook
    }
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

  const productsList = productsData?.items || [];
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
            placeholder="Cari semua produk (nama, brand, dll)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 rounded-xl bg-slate-50 border-slate-200 text-xs focus-visible:ring-primary"
          />
          {isFetching && (
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
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
        ) : productsList && productsList.length > 0 ? (
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
                {productsList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative shrink-0">
                          {p.foto_utama ? (
                            <ProductImage src={p.foto_utama} alt={p.nama_produk} fill className="object-cover" />
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

      {/* Pagination Controls */}
      {productsData && productsData.total_pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-xs">
          <p className="text-xs text-slate-500">
            Halaman <span className="font-semibold text-slate-700">{productsData.page}</span> dari{" "}
            <span className="font-semibold text-slate-700">{productsData.total_pages}</span> (Total{" "}
            <span className="font-semibold text-slate-700">{productsData.total}</span> produk)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1 || isFetching}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              className="rounded-full text-xs gap-1 border-slate-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Sebelumnya
            </Button>
            <span className="text-xs font-semibold px-2 text-slate-700">
              {currentPage} / {productsData.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= productsData.total_pages || isFetching}
              onClick={() => setCurrentPage((prev) => Math.min(productsData.total_pages, prev + 1))}
              className="rounded-full text-xs gap-1 border-slate-200"
            >
              Selanjutnya <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal Form Produk (Tambah & Edit) */}
      <Dialog open={formModalOpen} onOpenChange={setFormModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border border-slate-100 shadow-2xl">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100 pr-12 shrink-0">
            <DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {editingProductId ? "Edit Data Produk" : "Tambah Produk Baru"}
              {isLoadingDetail && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
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
                    placeholder="Contoh: 85000"
                    value={harga}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHarga(val === "" ? "" : Math.max(0, Number(val)));
                    }}
                    className="text-xs rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 block">Harga Asli / Coret (Rp)</label>
                    {typeof harga === "number" && typeof hargaAsli === "number" && hargaAsli > harga && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                        Diskon {Math.round(((hargaAsli - harga) / hargaAsli) * 100)}%
                      </span>
                    )}
                  </div>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Opsional jika promo"
                    value={hargaAsli}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHargaAsli(val === "" ? "" : Math.max(0, Number(val)));
                    }}
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
                    onChange={(e) => {
                      const val = e.target.value;
                      setStok(val === "" ? "" : Math.max(0, Number(val)));
                    }}
                    className="text-xs rounded-xl bg-slate-50 border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setSubCategoryId("");
                    }}
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

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Sub-Kategori</label>
                  <select
                    value={subCategoryId}
                    onChange={(e) => setSubCategoryId(e.target.value)}
                    disabled={!categoryId || subCategories.length === 0}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    <option value="">
                      {!categoryId
                        ? "-- Pilih Kategori Dahulu --"
                        : subCategories.length === 0
                        ? "-- Tidak Ada Sub-Kategori --"
                        : "-- Pilih Sub-Kategori --"}
                    </option>
                    {subCategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Komponen Upload Foto dengan Supabase Storage */}
              <div className="space-y-4">
                <ImageUploader
                  value={fotoUtama}
                  onChange={(url) => setFotoUtama(url)}
                  onUploadingChange={(uploading) => setIsUploadingImage(uploading)}
                  label="Foto Utama Produk *"
                />

                <MultiImageUploader
                  values={galleryImages}
                  onChange={(urls) => setGalleryImages(urls)}
                  onUploadingChange={(uploading) => setIsUploadingGallery(uploading)}
                  label="Galeri Foto Tambahan (Bisa Banyak)"
                  maxFiles={6}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Waktu Pakai
                  </label>
                  <select
                    value={usageTime}
                    onChange={(e) => setUsageTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-primary"
                  >
                    <option value="Pagi & Malam">Pagi & Malam (Universal)</option>
                    <option value="Pagi (AM)">Pagi Saja (AM - Sunscreen, Day Cream, dll)</option>
                    <option value="Malam (PM)">Malam Saja (PM - Retinol, Night Cream, dll)</option>
                    <option value="Fleksibel / Sesuai Kebutuhan">Fleksibel / Sesuai Kebutuhan</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Tekstur Produk
                  </label>
                  <select
                    value={
                      [
                        "Liquid / Serum",
                        "Cream",
                        "Gel",
                        "Foam / Gel",
                        "Liquid / Water",
                        "Lotion",
                        "Mist / Spray",
                        "Powder",
                        "Balm",
                      ].includes(texture)
                        ? texture
                        : "custom"
                    }
                    onChange={(e) => {
                      if (e.target.value === "custom") {
                        setTexture("");
                      } else {
                        setTexture(e.target.value);
                      }
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-primary"
                  >
                    <option value="Liquid / Serum">Liquid / Serum</option>
                    <option value="Cream">Cream</option>
                    <option value="Gel">Gel</option>
                    <option value="Foam / Gel">Foam / Gel (Pembersih)</option>
                    <option value="Liquid / Water">Liquid / Water (Toner/Micellar)</option>
                    <option value="Lotion">Lotion</option>
                    <option value="Mist / Spray">Mist / Spray</option>
                    <option value="Powder">Powder (Bedak / Loose Powder)</option>
                    <option value="Balm">Balm / Cleansing Balm</option>
                    <option value="custom">-- Ketik Tekstur Manual... --</option>
                  </select>
                  {(![
                    "Liquid / Serum",
                    "Cream",
                    "Gel",
                    "Foam / Gel",
                    "Liquid / Water",
                    "Lotion",
                    "Mist / Spray",
                    "Powder",
                    "Balm",
                  ].includes(texture) || texture === "") && (
                    <Input
                      placeholder="Masukkan tekstur khusus..."
                      value={texture}
                      onChange={(e) => setTexture(e.target.value)}
                      className="text-xs rounded-xl bg-slate-50 border-slate-200 mt-1.5"
                    />
                  )}
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
                disabled={isSaving || isUploadingImage || isUploadingGallery}
                className="rounded-full bg-primary hover:bg-rose-600 text-white gap-1.5"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : isUploadingImage || isUploadingGallery ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Mengupload Gambar...
                  </>
                ) : (
                  "Simpan Produk"
                )}
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
