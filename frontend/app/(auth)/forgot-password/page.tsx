"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/features/auth/authApi";
import { toast } from "sonner";

const emailSchema = z.object({
  email: z.string().email("Format alamat email tidak valid"),
});

const resetSchema = z
  .object({
    code: z.string().length(6, "Kode OTP harus 6 digit angka"),
    new_password: z.string().min(8, "Password minimal 8 karakter"),
    confirm_password: z.string().min(8, "Konfirmasi password minimal 8 karakter"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Konfirmasi password baru tidak cocok",
    path: ["confirm_password"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<1 | 2>(1);
  const [targetEmail, setTargetEmail] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Form Step 1: Email
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // Form Step 2: Reset
  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    formState: { errors: errorsReset },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const onSendOtp = async (data: EmailFormData) => {
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(data.email);
      setTargetEmail(data.email);
      setStep(2);
      toast.success(res.message || "Kode OTP reset password telah dikirim!", {
        description: `Periksa email ${data.email}.`,
      });
    } catch (err: any) {
      const detail =
        err.response?.data?.detail || "Email tidak ditemukan atau terjadi kesalahan.";
      toast.error("Gagal Mengirim Kode", { description: detail });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async (data: ResetFormData) => {
    setIsLoading(true);
    try {
      const res = await authApi.resetPassword({
        email: targetEmail,
        code: data.code,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      toast.success(res.message || "Password berhasil diubah!", {
        description: "Silakan masuk dengan password baru Anda.",
      });
      router.push("/login?reset=true");
    } catch (err: any) {
      const detail =
        err.response?.data?.detail || "Kode OTP salah atau telah kedaluwarsa.";
      toast.error("Gagal Reset Password", { description: detail });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-border/80 shadow-md flex flex-col gap-6">
        {/* LOGO & HEADING */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-full bg-blush-100 text-primary flex items-center justify-center shadow-xs mb-1">
            <KeyRound className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-800 tracking-tight">
            {step === 1 ? "Lupa Password?" : "Tetapkan Password Baru"}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            {step === 1
              ? "Masukkan email Anda untuk menerima kode OTP pemulihan password."
              : `Masukkan 6-digit kode OTP yang dikirim ke ${targetEmail}.`}
          </p>
        </div>

        {/* STEP 1: REQUEST OTP */}
        {step === 1 ? (
          <form onSubmit={handleSubmitEmail(onSendOtp)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  {...registerEmail("email")}
                  type="email"
                  placeholder="nama@email.com"
                  className={`pl-10 rounded-xl h-11 text-sm ${
                    errorsEmail.email ? "border-destructive focus-visible:ring-destructive" : ""
                  }`}
                  disabled={isLoading}
                />
              </div>
              {errorsEmail.email && (
                <span className="text-xs text-destructive font-medium mt-0.5">
                  {errorsEmail.email.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-full bg-primary hover:bg-rose-600 text-white font-bold text-sm shadow-md mt-2 gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengirim OTP...
                </>
              ) : (
                <>
                  Kirim Kode OTP <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          /* STEP 2: ENTER OTP & NEW PASSWORD */
          <form onSubmit={handleSubmitReset(onResetPassword)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                Kode OTP (6 Digit)
              </label>
              <Input
                {...registerReset("code")}
                type="text"
                maxLength={6}
                placeholder="123456"
                className={`rounded-xl h-11 text-center text-lg font-bold tracking-widest ${
                  errorsReset.code ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                disabled={isLoading}
              />
              {errorsReset.code && (
                <span className="text-xs text-destructive font-medium mt-0.5">
                  {errorsReset.code.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                Password Baru
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  {...registerReset("new_password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  className={`pl-10 pr-10 rounded-xl h-11 text-sm ${
                    errorsReset.new_password ? "border-destructive focus-visible:ring-destructive" : ""
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
              {errorsReset.new_password && (
                <span className="text-xs text-destructive font-medium mt-0.5">
                  {errorsReset.new_password.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-navy-800 uppercase tracking-wider">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  {...registerReset("confirm_password")}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Ulangi password baru"
                  className={`pl-10 pr-10 rounded-xl h-11 text-sm ${
                    errorsReset.confirm_password
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
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
              {errorsReset.confirm_password && (
                <span className="text-xs text-destructive font-medium mt-0.5">
                  {errorsReset.confirm_password.message}
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-full bg-primary hover:bg-rose-600 text-white font-bold text-sm shadow-md mt-2 gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Memperbarui...
                </>
              ) : (
                <>
                  Simpan Password Baru <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* BACK TO LOGIN */}
        <div className="text-center text-xs text-stone-600 pt-2 border-t border-border/60">
          <Link href="/login" className="inline-flex items-center gap-1 font-bold text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
