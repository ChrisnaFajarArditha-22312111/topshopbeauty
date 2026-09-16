"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, CheckCircle2, RotateCcw, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/useAuth";
import { toast } from "sonner";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const { verifyEmail, resendVerification } = useAuth();
  const [email, setEmail] = React.useState(emailParam);
  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);

  // 10 minutes countdown (600 seconds)
  const [timeLeft, setTimeLeft] = React.useState(600);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  // Countdown timer
  React.useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle single digit input
  const handleOtpChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue) {
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    const digit = cleanValue.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto advance to next box
    if (index < 5 && digit) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Paste 6 digits
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);

    const nextIndex = Math.min(pasteData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otp.join("");
    if (fullCode.length !== 6) {
      toast.error("Masukkan 6 digit kode OTP secara lengkap");
      return;
    }

    if (!email) {
      toast.error("Alamat email tidak ditemukan. Masukkan email Anda.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyEmail({ email, code: fullCode });
      toast.success(res.message || "Email berhasil diverifikasi!", {
        description: "Akun Anda kini aktif. Silakan masuk untuk berbelanja.",
      });
      router.push(`/login?verified=true&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      const detail =
        err.response?.data?.detail || "Kode OTP salah atau telah kedaluwarsa.";
      toast.error("Verifikasi Gagal", { description: detail });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Alamat email tidak boleh kosong");
      return;
    }

    setIsResending(true);
    try {
      const res = await resendVerification(email);
      setTimeLeft(600); // Reset timer 10 menit
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      toast.success(res.message || "Kode OTP baru telah dikirim!", {
        description: `Periksa kotak masuk email ${email}.`,
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Gagal mengirim ulang kode.";
      toast.error("Gagal Kirim Ulang", { description: detail });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-border/80 shadow-md flex flex-col gap-6 text-center">
        {/* ICON & HEADING */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-blush-100 text-primary flex items-center justify-center shadow-xs">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-navy-800 tracking-tight">
            Verifikasi Email Anda
          </h1>
          <p className="text-xs sm:text-sm text-stone-600">
            Kami telah mengirimkan 6-digit kode OTP ke:
            <br />
            <strong className="text-navy-950 font-semibold">{email || "email Anda"}</strong>
          </p>
        </div>

        {/* OTP INPUT FORM */}
        <form onSubmit={handleVerify} className="flex flex-col gap-6">
          <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold text-navy-950 bg-stone-50 border border-border/80 rounded-2xl focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-2xs"
              />
            ))}
          </div>

          {/* TIMER & RESEND */}
          <div className="flex items-center justify-between text-xs px-2">
            <span className="text-muted-foreground">
              Masa berlaku:{" "}
              <span className={`font-bold ${timeLeft < 60 ? "text-destructive" : "text-primary"}`}>
                {formatTime(timeLeft)}
              </span>
            </span>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1 font-bold text-primary hover:underline disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResending ? "animate-spin" : ""}`} />
              Kirim Ulang OTP
            </button>
          </div>

          {/* SUBMIT BUTTON */}
          <Button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full h-11 rounded-full bg-primary hover:bg-rose-600 text-white font-bold text-sm shadow-md gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memverifikasi...
              </>
            ) : (
              <>
                Verifikasi Sekarang <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        {/* FOOTER */}
        <div className="text-center text-xs text-stone-600 pt-2 border-t border-border/60">
          Salah alamat email?{" "}
          <Link href="/register" className="font-bold text-primary hover:underline">
            Daftar Ulang
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-[85vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
