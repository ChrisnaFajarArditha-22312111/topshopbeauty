"use client";

/**
 * MultiImageUploader.tsx — Komponen upload banyak gambar galeri produk ke Supabase Storage
 * Mendukung multiple upload sekaligus, preview gallery, hapus per foto, dan progress upload
 */

import React, { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";

interface MultiImageUploaderProps {
  /** Array URL gambar galeri saat ini */
  values: string[];
  /** Callback saat array URL gambar berubah (tambah / hapus) */
  onChange: (urls: string[]) => void;
  /** Callback status upload untuk mendisable form submit */
  onUploadingChange?: (isUploading: boolean) => void;
  /** Label, default: "Galeri Foto Tambahan" */
  label?: string;
  /** Batas maksimum foto galeri */
  maxFiles?: number;
}

export default function MultiImageUploader({
  values = [],
  onChange,
  onUploadingChange,
  label = "Galeri Foto Tambahan (Bisa Lebih dari 1)",
  maxFiles = 6,
}: MultiImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateUploading = (uploading: boolean) => {
    setIsUploading(uploading);
    if (onUploadingChange) {
      onUploadingChange(uploading);
    }
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const remainingSlots = maxFiles - values.length;
      if (remainingSlots <= 0) {
        setErrorMessage(`Maksimal ${maxFiles} foto galeri.`);
        return;
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots);
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

      for (const file of filesToUpload) {
        if (!allowedTypes.includes(file.type)) {
          setErrorMessage("Hanya file gambar yang diizinkan (JPEG, PNG, WebP, GIF).");
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage(`File ${file.name} melebihi batas 5 MB.`);
          return;
        }
      }

      setErrorMessage("");
      updateUploading(true);

      const uploadedUrls: string[] = [];

      try {
        for (const file of filesToUpload) {
          const formData = new FormData();
          formData.append("file", file);

          const response = await api.post<{ url: string; message: string }>(
            "/admin/upload/image",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );
          uploadedUrls.push(response.data.url);
        }

        onChange([...values, ...uploadedUrls]);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
        setErrorMessage(
          axiosErr?.response?.data?.detail ||
            axiosErr?.message ||
            "Gagal mengunggah beberapa gambar."
        );
      } finally {
        updateUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, maxFiles, onChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onChange(values.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="font-semibold text-slate-700 text-xs block">
          {label}{" "}
          <span className="text-[10px] text-slate-400 font-normal">
            ({values.length}/{maxFiles} foto)
          </span>
        </label>
      </div>

      {/* Grid Thumbnail Gambar Galeri */}
      <div className="flex flex-wrap gap-2.5 items-center">
        {values.map((url, idx) => (
          <div
            key={url + idx}
            className="relative h-20 w-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs shrink-0"
          >
            <Image
              src={url}
              alt={`Galeri ${idx + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => handleRemoveImage(idx)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white flex items-center justify-center opacity-90 transition-opacity shadow-xs"
              title="Hapus foto ini"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white text-center py-0.5 font-mono">
              #{idx + 1}
            </div>
          </div>
        ))}

        {/* Tombol Tambah Foto */}
        {values.length < maxFiles && (
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-20 w-20 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary/60 bg-slate-50 hover:bg-rose-50/30 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-primary transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-[9px] font-medium text-primary">Upload...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span className="text-[10px] font-medium">Tambah</span>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleInputChange}
          className="sr-only"
        />
      </div>

      {errorMessage && (
        <p className="text-[11px] text-rose-600 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
