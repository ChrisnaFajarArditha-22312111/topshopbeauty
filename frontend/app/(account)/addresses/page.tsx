"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  Loader2,
  Home,
  Building,
  Phone,
  User,
} from "lucide-react";
import { BackButton } from "@/components/shared/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddresses } from "@/features/addresses/useAddresses";
import { Address, AddressCreateInput } from "@/features/addresses/addressTypes";
import { useAuth } from "@/features/auth/useAuth";

const addressSchema = z.object({
  label: z.string().min(1, "Label wajib diisi (misal: Rumah, Kantor)"),
  recipient_name: z.string().min(2, "Nama penerima minimal 2 karakter"),
  phone: z.string().min(8, "Nomor telepon minimal 8 digit"),
  address: z.string().min(5, "Alamat lengkap wajib diisi"),
  province: z.string().min(2, "Provinsi wajib diisi"),
  city: z.string().min(2, "Kota / Kabupaten wajib diisi"),
  district: z.string().min(2, "Kecamatan wajib diisi"),
  postal_code: z.string().min(3, "Kode pos wajib diisi"),
  is_default: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

function AddressesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/profile";
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    addresses,
    isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAddresses();

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingAddress, setEditingAddress] = React.useState<Address | null>(null);

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/login?redirect=/addresses`);
    }
  }, [authLoading, isAuthenticated, router]);


  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: "Rumah",
      recipient_name: "",
      phone: "",
      address: "",
      province: "Lampung",
      city: "Bandar Lampung",
      district: "",
      postal_code: "",
      is_default: false,
    },
  });

  const handleOpenCreate = () => {
    setEditingAddress(null);
    reset({
      label: "Rumah",
      recipient_name: "",
      phone: "",
      address: "",
      province: "Lampung",
      city: "Bandar Lampung",
      district: "",
      postal_code: "",
      is_default: addresses.length === 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingAddress(addr);
    reset({
      label: addr.label,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address: addr.address,
      province: addr.province,
      city: addr.city,
      district: addr.district,
      postal_code: addr.postal_code,
      is_default: addr.is_default,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: AddressFormData) => {
    if (editingAddress) {
      await updateAddress({ id: editingAddress.id, data });
    } else {
      await createAddress(data);
    }
    setIsModalOpen(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex flex-col gap-6">
      {/* TOP BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <BackButton
          href={redirectTo}
          label={`Kembali ke ${redirectTo === "/checkout" ? "Checkout" : "Profil"}`}
        >
          <h1 className="text-2xl font-bold text-navy-900">
            Buku Alamat Pengiriman
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Alamat pengiriman Biteship untuk pesanan Anda.
          </p>
        </BackButton>

        <Button
          onClick={handleOpenCreate}
          className="rounded-full bg-primary hover:bg-rose-600 text-white font-semibold text-xs h-10 px-5 gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Alamat
        </Button>
      </div>

      {/* ADDRESS LIST */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-border/80 shadow-xs flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blush-100 text-primary flex items-center justify-center">
            <MapPin className="w-8 h-8" />
          </div>
          <div className="max-w-sm">
            <h3 className="font-bold text-lg text-navy-800">Belum Ada Alamat Tersimpan</h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Tambahkan alamat pengiriman utama Anda untuk mempermudah proses checkout pesanan.
            </p>
          </div>
          <Button
            onClick={handleOpenCreate}
            className="rounded-full bg-primary hover:bg-rose-600 text-white font-semibold text-xs px-6 shadow-sm"
          >
            Tambah Alamat Sekarang
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between gap-4 relative shadow-xs ${
                addr.is_default
                  ? "border-primary/40 ring-1 ring-primary/20 bg-rose-50/20"
                  : "border-border/80 hover:border-primary/30"
              }`}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-navy-950 uppercase tracking-wider">
                      {addr.label}
                    </span>
                    {addr.is_default && (
                      <Badge className="bg-primary/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                        Alamat Utama
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(addr)}
                      className="p-1.5 text-muted-foreground hover:text-primary rounded-lg transition-colors"
                      title="Ubah Alamat"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAddress(addr.id)}
                      disabled={isDeleting}
                      className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                      title="Hapus Alamat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs text-stone-600 pt-1">
                  <p className="font-bold text-sm text-navy-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" /> {addr.recipient_name}
                  </p>
                  <p className="flex items-center gap-1.5 text-stone-600">
                    <Phone className="w-3.5 h-3.5 text-primary" /> {addr.phone}
                  </p>
                  <p className="text-stone-700 leading-relaxed mt-1">{addr.address}</p>
                  <p className="text-stone-500 font-medium">
                    {addr.district}, {addr.city}, {addr.province} {addr.postal_code}
                  </p>
                </div>
              </div>

              {!addr.is_default && (
                <div className="pt-3 border-t border-border/60 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDefaultAddress(addr.id)}
                    className="rounded-full text-xs font-semibold text-primary hover:bg-blush-100 h-8 px-3"
                  >
                    Jadikan Alamat Utama
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM TAMBAH / EDIT ALAMAT */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border border-border/80 shadow-2xl bg-white">
          <DialogHeader className="p-6 pb-4 border-b border-border/60 pr-12 shrink-0 bg-white text-left">
            <DialogTitle className="text-lg font-extrabold text-navy-800">
              {editingAddress ? "Ubah Alamat Pengiriman" : "Tambah Alamat Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Pastikan alamat dan kode pos sesuai untuk akurasi perhitungan ongkir Biteship.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-left overscroll-contain">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                    Label Alamat
                  </label>
                  <Input
                    {...register("label")}
                    placeholder="Rumah / Kantor"
                    className="rounded-xl text-sm"
                  />
                  {errors.label && (
                    <span className="text-xs text-destructive">{errors.label.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                    Nomor HP / WhatsApp
                  </label>
                  <Input
                    {...register("phone")}
                    placeholder="08123456789"
                    className="rounded-xl text-sm"
                  />
                  {errors.phone && (
                    <span className="text-xs text-destructive">{errors.phone.message}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                  Nama Penerima
                </label>
                <Input
                  {...register("recipient_name")}
                  placeholder="Nama lengkap penerima"
                  className="rounded-xl text-sm"
                />
                {errors.recipient_name && (
                  <span className="text-xs text-destructive">{errors.recipient_name.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                  Alamat Lengkap (Jalan, No Rumah, RT/RW)
                </label>
                <textarea
                  {...register("address")}
                  rows={3}
                  placeholder="Jl. Raden Intan No. 88, Tanjung Karang..."
                  className="w-full rounded-xl border border-border/80 bg-white p-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.address && (
                  <span className="text-xs text-destructive">{errors.address.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                    Provinsi
                  </label>
                  <Input
                    {...register("province")}
                    placeholder="Lampung"
                    className="rounded-xl text-sm"
                  />
                  {errors.province && (
                    <span className="text-xs text-destructive">{errors.province.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                    Kota / Kabupaten
                  </label>
                  <Input
                    {...register("city")}
                    placeholder="Bandar Lampung"
                    className="rounded-xl text-sm"
                  />
                  {errors.city && (
                    <span className="text-xs text-destructive">{errors.city.message}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                    Kecamatan
                  </label>
                  <Input
                    {...register("district")}
                    placeholder="Enggal"
                    className="rounded-xl text-sm"
                  />
                  {errors.district && (
                    <span className="text-xs text-destructive">{errors.district.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                    Kode Pos
                  </label>
                  <Input
                    {...register("postal_code")}
                    placeholder="35118"
                    className="rounded-xl text-sm"
                  />
                  {errors.postal_code && (
                    <span className="text-xs text-destructive">{errors.postal_code.message}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_default"
                  {...register("is_default")}
                  className="w-4 h-4 rounded text-primary accent-primary"
                />
                <label htmlFor="is_default" className="text-xs text-stone-700 cursor-pointer">
                  Jadikan sebagai alamat pengiriman utama
                </label>
              </div>
            </div>

            <div className="p-4 px-6 border-t border-border/60 flex justify-end gap-2 shrink-0 bg-muted/20">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                disabled={isCreating || isUpdating}
                className="rounded-full text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isCreating || isUpdating}
                className="rounded-full bg-primary hover:bg-rose-600 text-white text-xs font-bold px-6 shadow-sm"
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Menyimpan...
                  </>
                ) : (
                  "Simpan Alamat"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AddressesPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>}>
      <AddressesContent />
    </React.Suspense>
  );
}
