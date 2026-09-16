"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/useAuth";
import { toast } from "sonner";

const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, "Nama lengkap minimal 2 karakter")
      .max(100, "Nama terlalu panjang"),
    email: z.string().email("Format alamat email tidak valid"),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .max(100, "Password maksimal 100 karakter"),
    confirm_password: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm_password"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const { register: registerUser, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const res = await registerUser(data);
      toast.success(res.message || "Pendaftaran berhasil!", {
        description: "Kode OTP 6-digit telah dikirim ke email Anda.",
      });
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      const detail =
        err.response?.data?.detail || "Gagal melakukan pendaftaran. Silakan coba lagi.";
      toast.error("Pendaftaran Gagal", { description: detail });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-border/80 shadow-md flex flex-col gap-6">
        {/* LOGO & HEADING */}
        <div className="flex flex-col items-center text-center gap-2">
          <Link href="/" className="inline-flex items-center gap-2 group mb-1">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white border border-pink-200/80 shadow-xs flex items-center justify-center transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Logo Topshop"
                width={38}
                height={38}
                className="object-contain"
              />
            </div>
            <span className="font-extrabold text-xl text-primary tracking-tight">
              Topshop Beauty
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-navy-800 tracking-tight">
            Buat Akun Baru
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Daftar untuk menikmati konsultasi AI personal & promo eksklusif.
          </p>
        </div>

        {/* REGISTER FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* NAMA LENGKAP */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                {...register("full_name")}
                type="text"
                placeholder="Aisyah Putri"
                className={`pl-10 rounded-xl h-11 text-sm ${
                  errors.full_name ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.full_name && (
              <span className="text-xs text-destructive font-medium mt-0.5">
                {errors.full_name.message}
              </span>
            )}
          </div>

          {/* EMAIL */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                {...register("email")}
                type="email"
                placeholder="nama@email.com"
                className={`pl-10 rounded-xl h-11 text-sm ${
                  errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <span className="text-xs text-destructive font-medium mt-0.5">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* PASSWORD */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                className={`pl-10 pr-10 rounded-xl h-11 text-sm ${
                  errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy-800"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <span className="text-xs text-destructive font-medium mt-0.5">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
              Konfirmasi Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                {...register("confirm_password")}
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Ulangi password Anda"
                className={`pl-10 pr-10 rounded-xl h-11 text-sm ${
                  errors.confirm_password ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-navy-800"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirm_password && (
              <span className="text-xs text-destructive font-medium mt-0.5">
                {errors.confirm_password.message}
              </span>
            )}
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-full bg-primary hover:bg-rose-600 text-white font-bold text-sm shadow-md mt-3 gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Mendaftarkan...
              </>
            ) : (
              <>
                Daftar Akun <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* LOGIN LINK */}
        <div className="text-center text-xs text-stone-600 pt-2 border-t border-border/60">
          Sudah memiliki akun?{" "}
          <Link
            href={redirectUrl !== "/" ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : "/login"}
            className="font-bold text-primary hover:underline"
          >
            Masuk di Sini
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <RegisterForm />
    </React.Suspense>
  );
}
