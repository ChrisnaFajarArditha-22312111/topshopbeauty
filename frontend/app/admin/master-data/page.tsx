"use client";

import React, { useState } from "react";
import {
  Database,
  Plus,
  Tag,
  Sparkles,
  Layers,
  FlaskConical,
  RefreshCw,
  FolderTree,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useAdminCategories,
  useAdminBrands,
  useAdminSkinTypes,
  useAdminSkinConcerns,
} from "@/features/admin/useAdmin";
import { adminApi } from "@/features/admin/adminApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function AdminMasterDataPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("categories");

  // Dialog States
  const [modalType, setModalType] = useState<
    "category" | "sub-category" | "brand" | "skin-type" | "skin-concern" | "ingredient" | null
  >(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // Queries
  const { data: categories, isLoading: loadingCat, refetch: refetchCat } = useAdminCategories();
  const { data: brands, isLoading: loadingBrand, refetch: refetchBrand } = useAdminBrands();
  const { data: skinTypes, isLoading: loadingSkin, refetch: refetchSkin } = useAdminSkinTypes();
  const { data: skinConcerns, isLoading: loadingConcerns, refetch: refetchConcerns } = useAdminSkinConcerns();

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => adminApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Kategori berhasil ditambahkan!");
      handleCloseModal();
    },
    onError: () => toast.error("Gagal menambahkan kategori"),
  });

  const createSubCategoryMutation = useMutation({
    mutationFn: (data: { category_id: string; name: string }) => adminApi.createSubCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("Sub-kategori berhasil ditambahkan!");
      handleCloseModal();
    },
    onError: () => toast.error("Gagal menambahkan sub-kategori"),
  });

  const createBrandMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; logo_url?: string }) => adminApi.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "brands"] });
      toast.success("Brand baru berhasil ditambahkan!");
      handleCloseModal();
    },
    onError: () => toast.error("Gagal menambahkan brand"),
  });

  const createSkinTypeMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => adminApi.createSkinType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "skin-types"] });
      toast.success("Tipe kulit berhasil ditambahkan!");
      handleCloseModal();
    },
    onError: () => toast.error("Gagal menambahkan tipe kulit"),
  });

  const createSkinConcernMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => adminApi.createSkinConcern(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "skin-concerns"] });
      toast.success("Masalah kulit berhasil ditambahkan!");
      handleCloseModal();
    },
    onError: () => toast.error("Gagal menambahkan masalah kulit"),
  });

  const createIngredientMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => adminApi.createIngredient(data),
    onSuccess: () => {
      toast.success("Bahan aktif (ingredient) berhasil ditambahkan!");
      handleCloseModal();
    },
    onError: () => toast.error("Gagal menambahkan ingredient"),
  });

  const handleCloseModal = () => {
    setModalType(null);
    setName("");
    setDescription("");
    setLogoUrl("");
    setSelectedCategoryId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (modalType === "category") {
      createCategoryMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
    } else if (modalType === "sub-category") {
      if (!selectedCategoryId) {
        toast.error("Pilih kategori induk terlebih dahulu!");
        return;
      }
      createSubCategoryMutation.mutate({ category_id: selectedCategoryId, name: name.trim() });
    } else if (modalType === "brand") {
      createBrandMutation.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
      });
    } else if (modalType === "skin-type") {
      createSkinTypeMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
    } else if (modalType === "skin-concern") {
      createSkinConcernMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
    } else if (modalType === "ingredient") {
      createIngredientMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
    }
  };

  const isSaving =
    createCategoryMutation.isPending ||
    createSubCategoryMutation.isPending ||
    createBrandMutation.isPending ||
    createSkinTypeMutation.isPending ||
    createSkinConcernMutation.isPending ||
    createIngredientMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
            Master Data Kecantikan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola taksonomi katalog: Kategori, Brand, Tipe Kulit, Masalah Kulit, dan Bahan Aktif produk.
          </p>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="categories" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl h-auto flex flex-wrap gap-1">
          <TabsTrigger value="categories" className="rounded-xl text-xs py-2 px-3 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Layers className="w-3.5 h-3.5" /> Kategori
          </TabsTrigger>
          <TabsTrigger value="brands" className="rounded-xl text-xs py-2 px-3 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Tag className="w-3.5 h-3.5" /> Brand
          </TabsTrigger>
          <TabsTrigger value="skin-types" className="rounded-xl text-xs py-2 px-3 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
            <Sparkles className="w-3.5 h-3.5" /> Tipe Kulit
          </TabsTrigger>
          <TabsTrigger value="skin-concerns" className="rounded-xl text-xs py-2 px-3 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
            <FolderTree className="w-3.5 h-3.5" /> Masalah Kulit
          </TabsTrigger>
          <TabsTrigger value="ingredients" className="rounded-xl text-xs py-2 px-3 gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-white">
            <FlaskConical className="w-3.5 h-3.5" /> Ingredients
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Kategori & Sub-Kategori */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Daftar Kategori & Sub-Kategori</h2>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModalType("sub-category")}
                className="rounded-full text-xs border-slate-200"
              >
                + Sub-Kategori
              </Button>
              <Button
                size="sm"
                onClick={() => setModalType("category")}
                className="rounded-full bg-primary hover:bg-rose-600 text-white text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Kategori
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingCat ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)
            ) : categories && categories.length > 0 ? (
              categories.map((cat) => (
                <div key={cat.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <h3 className="font-bold text-sm text-slate-800">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-xs text-slate-500 mt-1 mb-3">{cat.description}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">
                      Sub-Kategori:
                    </span>
                    {cat.sub_categories && cat.sub_categories.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {cat.sub_categories.map((sub) => (
                          <span
                            key={sub.id}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
                          >
                            {sub.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Belum ada sub-kategori</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Belum ada data kategori.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Brand */}
        <TabsContent value="brands" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Daftar Brand Kosmetik & Skincare</h2>
            <Button
              size="sm"
              onClick={() => setModalType("brand")}
              className="rounded-full bg-primary hover:bg-rose-600 text-white text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Brand
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {loadingBrand ? (
              [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
            ) : brands && brands.length > 0 ? (
              brands.map((brand) => (
                <div
                  key={brand.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs text-center hover:border-pink-200 transition-all flex flex-col items-center justify-center min-h-[90px]"
                >
                  <span className="font-bold text-xs text-slate-800 block">{brand.name}</span>
                  {brand.description && (
                    <span className="text-[10px] text-slate-400 block truncate max-w-[120px] mt-0.5">
                      {brand.description}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Belum ada data brand.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Tipe Kulit */}
        <TabsContent value="skin-types" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Master Data Tipe Kulit</h2>
            <Button
              size="sm"
              onClick={() => setModalType("skin-type")}
              className="rounded-full bg-primary hover:bg-rose-600 text-white text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Tipe Kulit
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {loadingSkin ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
            ) : skinTypes && skinTypes.length > 0 ? (
              skinTypes.map((st) => (
                <div key={st.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <h3 className="font-bold text-xs text-slate-800">{st.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1">{st.description || "Karakteristik jenis kulit"}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Belum ada data tipe kulit.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Masalah Kulit */}
        <TabsContent value="skin-concerns" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Master Data Masalah Kulit</h2>
            <Button
              size="sm"
              onClick={() => setModalType("skin-concern")}
              className="rounded-full bg-primary hover:bg-rose-600 text-white text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Masalah Kulit
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {loadingConcerns ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
            ) : skinConcerns && skinConcerns.length > 0 ? (
              skinConcerns.map((sc) => (
                <div key={sc.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                  <h3 className="font-bold text-xs text-slate-800">{sc.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1">{sc.description || "Kondisi kulit spesifik"}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs">
                Belum ada data masalah kulit.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 5: Ingredients */}
        <TabsContent value="ingredients" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Master Bahan Aktif (Ingredients)</h2>
            <Button
              size="sm"
              onClick={() => setModalType("ingredient")}
              className="rounded-full bg-primary hover:bg-rose-600 text-white text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Ingredient
            </Button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
            Gunakan tombol di atas untuk mendaftarkan bahan aktif baru (misal: Niacinamide, Salicylic Acid, Ceramide).
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Tambah Master Data */}
      <Dialog open={!!modalType} onOpenChange={() => handleCloseModal()}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-800 capitalize">
              Tambah {modalType?.replace("-", " ")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            {modalType === "sub-category" && (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Kategori Induk *</label>
                <select
                  required
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
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
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama *</label>
              <Input
                required
                placeholder="Contoh: Skincare, Garnier, Dry Skin..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            {modalType === "brand" && (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">URL Logo (Opsional)</label>
                <Input
                  placeholder="https://..."
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="text-xs rounded-xl bg-slate-50 border-slate-200"
                />
              </div>
            )}

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Deskripsi (Opsional)</label>
              <Input
                placeholder="Penjelasan ringkas..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCloseModal} className="rounded-full">
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving}
                className="rounded-full bg-primary hover:bg-rose-600 text-white"
              >
                {isSaving ? "Menyimpan..." : "Simpan Data"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
