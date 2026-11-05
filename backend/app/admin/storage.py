"""
storage.py — Supabase Storage Service untuk Upload Gambar Produk
Menggunakan Supabase Storage REST API via httpx (tanpa SDK tambahan)
"""
import uuid
import logging
from typing import Optional

import httpx
from fastapi import UploadFile, HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)

# Ekstensi yang diizinkan untuk gambar produk
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
}

# Batas ukuran file: 5 MB
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024


async def upload_product_image(file: UploadFile, folder: str = "products") -> str:
    """
    Upload file gambar ke Supabase Storage dan kembalikan URL publik.

    Args:
        file: File upload dari FastAPI
        folder: Sub-folder dalam bucket (default: "products")

    Returns:
        URL publik gambar yang bisa langsung digunakan

    Raises:
        HTTPException: Jika file tidak valid, terlalu besar, atau upload gagal
    """
    # --- Validasi konfigurasi Supabase ---
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        logger.error("SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Layanan penyimpanan gambar belum dikonfigurasi. Tambahkan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY ke .env",
        )

    # --- Validasi tipe file ---
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Tipe file tidak didukung: '{content_type}'. Gunakan JPEG, PNG, WebP, atau GIF.",
        )

    # --- Baca isi file & validasi ukuran ---
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Ukuran file terlalu besar ({len(file_bytes) / 1024 / 1024:.1f} MB). Maksimum 5 MB.",
        )

    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File gambar kosong atau tidak valid.",
        )

    # --- Buat nama file unik agar tidak tabrakan ---
    ext_map = {
        "image/jpeg": "jpg",
        "image/jpg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
    }
    extension = ext_map.get(content_type, "jpg")
    unique_filename = f"{folder}/{uuid.uuid4().hex}.{extension}"

    # --- Upload ke Supabase Storage via REST API ---
    bucket = settings.SUPABASE_STORAGE_BUCKET
    upload_url = f"{settings.SUPABASE_URL}/storage/v1/object/{bucket}/{unique_filename}"

    headers = {
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "false",  # Jangan overwrite jika sudah ada (UUID membuat ini unik)
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(upload_url, content=file_bytes, headers=headers)

        if response.status_code not in (200, 201):
            error_detail = response.text or "Upload gagal"
            logger.error(f"Supabase upload error {response.status_code}: {error_detail}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Gagal mengupload gambar ke storage: {error_detail}",
            )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Upload gambar timeout. Coba lagi dalam beberapa saat.",
        )
    except httpx.RequestError as e:
        logger.error(f"Supabase connection error: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Tidak dapat terhubung ke layanan storage. Periksa konfigurasi Supabase.",
        )

    # --- Kembalikan URL publik ---
    public_url = (
        f"{settings.SUPABASE_URL}/storage/v1/object/public/{bucket}/{unique_filename}"
    )
    logger.info(f"✅ Gambar berhasil diupload: {public_url}")
    return public_url


async def delete_product_image(image_url: str) -> bool:
    """
    Hapus gambar dari Supabase Storage berdasarkan URL publiknya.

    Args:
        image_url: URL publik gambar yang ingin dihapus

    Returns:
        True jika berhasil, False jika gagal
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        return False

    # Ekstrak path file dari URL publik
    # Format: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}
    try:
        base_public = f"{settings.SUPABASE_URL}/storage/v1/object/public/{settings.SUPABASE_STORAGE_BUCKET}/"
        if not image_url.startswith(base_public):
            return False  # Bukan gambar Supabase kita, skip

        file_path = image_url[len(base_public):]
        delete_url = f"{settings.SUPABASE_URL}/storage/v1/object/{settings.SUPABASE_STORAGE_BUCKET}/{file_path}"

        headers = {
            "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.delete(delete_url, headers=headers)

        return response.status_code in (200, 204)

    except Exception as e:
        logger.warning(f"Gagal menghapus gambar dari storage: {e}")
        return False
