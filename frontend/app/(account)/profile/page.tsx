"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  User as UserIcon,
  Mail,
  Calendar,
  ShieldCheck,
  MapPin,
  Package,
  Heart,
  Lock,
  LogOut,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/useAuth";
import { authApi } from "@/features/auth/authApi";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Password lama wajib diisi"),
    new_password: z.string().min(8, "Password baru minimal 8 karakter"),
    confirm_new_password: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Konfirmasi password baru tidak cocok",
    path: ["confirm_new_password"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading, logout, isAuthenticated } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [showOldPassword, setShowOldPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirect=/profile");
    }
  }, [isLoading, isAuthenticated, router]);

  const onChangePassword = async (data: ChangePasswordFormData) => {
    setIsChangingPassword(true);
    try {
      const res = await authApi.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
      });
      toast.success(res.message || "Password berhasil diubah!");
      setIsDialogOpen(false);
      reset();
    } catch (err: any) {
      const detail =
        err.response?.data?.detail || "Gagal mengubah password. Periksa password lama Anda.";
      toast.error("Gagal Ubah Password", { description: detail });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-6">
      {/* TOP NAVIGATION */}
      <BackButton href="/" label="Kembali ke Beranda">
        <h1 className="text-xl sm:text-2xl font-bold text-navy-900 leading-tight">
          Akun Saya
        </h1>
      </BackButton>

      {/* HEADER PROFILE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border/80 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-rose-400 text-white flex items-center justify-center text-3xl font-extrabold shadow-md shrink-0">
            {user.email.charAt(0).toUpperCase()}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-navy-800 tracking-tight">
                {user.email.split("@")[0]}
              </h1>
              {user.is_admin && (
                <Badge className="bg-navy-800 text-white hover:bg-navy-950 text-xs">
                  Administrator
                </Badge>
              )}
              {user.email_verified ? (
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-300 text-xs gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terverifikasi
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                  Belum Verifikasi
                </Badge>
              )}
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </p>

            <p className="text-xs text-stone-500 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5" /> Bergabung sejak {formatDate(user.created_at)}
            </p>
          </div>
        </div>

        <Button
          onClick={logout}
          variant="outline"
          className="rounded-full text-destructive hover:bg-rose-50 hover:text-destructive border-destructive/30 text-xs font-semibold gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" /> Keluar
        </Button>
      </div>

      {/* QUICK MENU GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/addresses"
          className="bg-white rounded-2xl p-5 border border-border/80 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blush-100 text-primary flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy-800 group-hover:text-primary transition-colors">
                Buku Alamat
              </h3>
              <p className="text-xs text-muted-foreground">Alamat pengiriman Biteship</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/orders"
          className="bg-white rounded-2xl p-5 border border-border/80 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blush-100 text-primary flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy-800 group-hover:text-primary transition-colors">
                Pesanan Saya
              </h3>
              <p className="text-xs text-muted-foreground">Status & pelacakan resi</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>

        <Link
          href="/wishlist"
          className="bg-white rounded-2xl p-5 border border-border/80 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blush-100 text-primary flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy-800 group-hover:text-primary transition-colors">
                Favorit
              </h3>
              <p className="text-xs text-muted-foreground">Daftar produk idaman</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* SECURITY / CHANGE PASSWORD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-base text-navy-800">Keamanan Akun & Password</h3>
          </div>
          <p className="text-xs sm:text-sm text-stone-600">
            Perbarui password secara berkala untuk menjaga keamanan akun Anda.
          </p>
        </div>

        {/* DIALOG UBAH PASSWORD */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="rounded-full border-primary/30 text-primary hover:bg-blush-100 font-semibold text-xs h-10 px-5"
            >
              Ubah Password
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold text-navy-800">
                Ubah Password Akun
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Masukkan password lama dan password baru Anda.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onChangePassword)} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                  Password Lama
                </label>
                <div className="relative">
                  <Input
                    {...register("old_password")}
                    type={showOldPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10 rounded-xl text-sm"
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy-800"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.old_password && (
                  <span className="text-xs text-destructive">{errors.old_password.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                  Password Baru
                </label>
                <div className="relative">
                  <Input
                    {...register("new_password")}
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Minimal 8 karakter"
                    className="pr-10 rounded-xl text-sm"
                    disabled={isChangingPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy-800"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.new_password && (
                  <span className="text-xs text-destructive">{errors.new_password.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                  Konfirmasi Password Baru
                </label>
                <Input
                  {...register("confirm_new_password")}
                  type="password"
                  placeholder="Ulangi password baru"
                  className="rounded-xl text-sm"
                  disabled={isChangingPassword}
                />
                {errors.confirm_new_password && (
                  <span className="text-xs text-destructive">
                    {errors.confirm_new_password.message}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isChangingPassword}
                  className="rounded-full text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="rounded-full bg-primary hover:bg-rose-600 text-white text-xs font-bold px-5"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Menyimpan...
                    </>
                  ) : (
                    "Simpan Password"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
