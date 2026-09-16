"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/useAuth";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Format alamat email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const { login, googleLogin, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Jika sudah login, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, redirectUrl, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data);
      router.push(redirectUrl);
    } catch (err: any) {
      const detail =
        err.response?.data?.detail || "Email atau password salah. Silakan coba lagi.";
      toast.error("Gagal Masuk", { description: detail });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast.error("Gagal mengambil token Google");
      return;
    }
    setIsLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      // Redirect ditangani oleh useEffect di bawah saat isAuthenticated berubah jadi true
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Gagal masuk via Google OAuth";
      toast.error("Gagal Masuk Google", { description: detail });
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
            Selamat Datang Kembali
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Masuk untuk mengakses keranjang, rekomendasi AI, dan riwayat pesanan Anda.
          </p>
        </div>

        {/* GOOGLE SIGN IN BUTTON */}
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error("Autentikasi Google gagal dibatalkan")}
              theme="outline"
              size="large"
              shape="pill"
              text="continue_with"
              width="360"
            />
          </div>

          <div className="relative w-full flex items-center justify-center my-4">
            <div className="border-t border-border/80 w-full" />
            <span className="bg-white px-3 text-xs text-muted-foreground uppercase tracking-wider font-semibold absolute">
              atau dengan email
            </span>
          </div>
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Lupa password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
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

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-full bg-primary hover:bg-rose-600 text-white font-bold text-sm shadow-md mt-2 gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Masuk...
              </>
            ) : (
              <>
                Masuk ke Akun <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* REGISTER LINK */}
        <div className="text-center text-xs text-stone-600 pt-2 border-t border-border/60">
          Belum punya akun?{" "}
          <Link
            href={redirectUrl !== "/" ? `/register?redirect=${encodeURIComponent(redirectUrl)}` : "/register"}
            className="font-bold text-primary hover:underline"
          >
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
