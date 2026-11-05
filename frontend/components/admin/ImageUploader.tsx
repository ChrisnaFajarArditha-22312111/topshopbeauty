"use client";

/**
 * ImageUploader.tsx — Komponen upload gambar ke Supabase Storage
 * Mendukung drag-and-drop, preview langsung, progress upload, dan fallback URL manual
 */

import React, { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Link as LinkIcon, ImageIcon, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/axios";

interface ImageUploaderProps {
  /** URL gambar saat ini (untuk mode edit produk) */
  value: string;
  /** Callback dipanggil setiap kali URL gambar berubah (upload selesai atau URL manual diketik) */
  onChange: (url: string) => void;
  /** Callback status upload untuk mencegah submit saat proses upload masih berjalan */
  onUploadingChange?: (isUploading: boolean) => void;
  /** Label opsional, default: "Foto Utama Produk" */
  label?: string;
  /** Kelas CSS tambahan untuk wrapper */
  className?: string;
}

type InputMode = "upload" | "url";
type UploadState = "idle" | "uploading" | "success" | "error";

export default function ImageUploader({
  value,
  onChange,
  onUploadingChange,
  label = "Foto Utama Produk",
  className = "",
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<InputMode>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [urlInput, setUrlInput] = useState(value || "");

  // ——— Sinkronkan urlInput saat value berubah dari luar (mode edit) ———
  React.useEffect(() => {
    setUrlInput(value || "");
  }, [value]);

  const updateUploadState = (state: UploadState) => {
    setUploadState(state);
    if (onUploadingChange) {
      onUploadingChange(state === "uploading");
    }
  };

  // ——— Upload file ke backend → Supabase Storage ———
  const handleUpload = useCallback(
    async (file: File) => {
      // Validasi tipe di sisi client sebelum kirim
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage("Hanya file gambar yang diizinkan: JPEG, PNG, WebP, atau GIF.");
        updateUploadState("error");
        return;
      }

      // Validasi ukuran (5 MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage(`Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimum 5 MB.`);
        updateUploadState("error");
        return;
      }

      updateUploadState("uploading");
      setUploadProgress(0);
      setErrorMessage("");

      const formData = new FormData();
      formData.append("file", file);

      let progressInterval: NodeJS.Timeout | null = null;

      try {
        progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 15, 90));
        }, 150);

        const response = await api.post<{ url: string; message: string }>(
          "/admin/upload/image",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (progressInterval) clearInterval(progressInterval);
        setUploadProgress(100);
        updateUploadState("success");

        // Simpan URL ke state parent
        onChange(response.data.url);
        setUrlInput(response.data.url);

        // Reset state sukses setelah 2 detik
        setTimeout(() => {
          updateUploadState("idle");
          setUploadProgress(0);
        }, 2000);
      } catch (err: unknown) {
        if (progressInterval) clearInterval(progressInterval);
        updateUploadState("error");
        const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
        setErrorMessage(
          axiosErr?.response?.data?.detail ||
            axiosErr?.message ||
            "Upload gagal. Coba lagi."
        );
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange]
  );

  // ——— Handler file input biasa ———
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ——— Drag and Drop handlers ———
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // ——— URL manual ———
  const handleUrlBlur = () => {
    const cleanUrl = urlInput.trim();
    onChange(cleanUrl);
  };

  const handleClearImage = () => {
    onChange("");
    setUrlInput("");
    updateUploadState("idle");
    setErrorMessage("");
  };

  const hasImage = !!value && value.trim().length > 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label + toggle mode */}
      <div className="flex items-center justify-between">
        <label className="font-semibold text-slate-700 text-xs block">{label}</label>
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              mode === "upload"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Upload className="w-3 h-3" />
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              mode === "url"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            URL Manual
          </button>
        </div>
      </div>

      {/* Mode Upload File */}
      {mode === "upload" && (
        <div className="space-y-3">
          {/* Drop Zone */}
          <div
            className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
              isDragging
                ? "border-primary bg-rose-50"
                : uploadState === "error"
                ? "border-rose-300 bg-rose-50/50"
                : uploadState === "success"
                ? "border-emerald-400 bg-emerald-50/50"
                : "border-slate-200 bg-slate-50 hover:border-primary/50 hover:bg-rose-50/30"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileInputChange}
              className="sr-only"
            />

            <div className="flex flex-col items-center justify-center gap-2 py-6 px-4 text-center">
              {uploadState === "uploading" ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-xs font-medium text-slate-600">Mengupload ke Supabase Storage...</p>
                  {/* Progress bar */}
                  <div className="w-full max-w-xs bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">{uploadProgress}%</p>
                </>
              ) : uploadState === "success" ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <p className="text-xs font-semibold text-emerald-700">Gambar berhasil diupload!</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Drag & drop gambar di sini
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      atau{" "}
                      <span className="text-primary font-medium underline underline-offset-2">
                        klik untuk memilih file
                      </span>
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    JPEG, PNG, WebP, GIF — Maks. 5 MB
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Error message */}
          {uploadState === "error" && errorMessage && (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
              <X className="w-3.5 h-3.5 shrink-0" />
              {errorMessage}
            </p>
          )}
        </div>
      )}

      {/* Mode URL Manual */}
      {mode === "url" && (
        <div className="space-y-1.5">
          <Input
            type="url"
            placeholder="https://images.unsplash.com/..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={handleUrlBlur}
            className="text-xs rounded-xl bg-slate-50 border-slate-200"
          />
          <p className="text-[11px] text-slate-400">
            Gunakan URL HTTPS langsung ke file gambar (bukan halaman produk atau hasil pencarian).
          </p>
        </div>
      )}

      {/* Preview Gambar */}
      {hasImage && (
        <div className="relative inline-block">
          <div className="relative h-28 w-28 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            <Image
              src={value}
              alt="Pratinjau foto produk"
              fill
              className="object-contain"
              unoptimized
              onError={() => {
                /* fallback jika url tidak valid */
              }}
            />
          </div>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={handleClearImage}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-rose-600 hover:border-rose-200"
          >
            <X className="w-3 h-3" />
          </Button>
          <p className="mt-1 text-[10px] text-slate-400 font-mono truncate max-w-[280px]">
            {value.length > 45 ? value.slice(0, 45) + "..." : value}
          </p>
        </div>
      )}
    </div>
  );
}
