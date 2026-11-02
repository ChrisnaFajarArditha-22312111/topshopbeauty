"""
output_guard.py — Output Guardrail untuk AI Beauty Advisor
Memvalidasi dan menyaring respons keluaran model sebelum disajikan ke pengguna.
"""
import re
from typing import Optional

from app.beauty_advisor.guardrails.input_guard import DOMAIN_REFUSAL, is_fashion_request


MEDICAL_DISCLAIMER = (
    "\n\n*Catatan: Rekomendasi di atas bersifat konsultasi kosmetik umum. "
    "Jika kulit Anda mengalami iritasi parah, infeksi, atau luka terbuka, "
    "sangat dianjurkan untuk berkonsultasi langsung dengan dokter spesialis kulit (dermatologis).*"
)


def check_output_guard(response_text: str, user_query: str = "") -> str:
    """
    Memeriksa dan memformat respons dari LLM:
    1. Menyaring kebocoran prompt internal
    2. Menambahkan disclaimer medis jika membahas kondisi sensitif (misal alergi/iritasi parah)
    3. Memastikan respons rapi dan santun

    Args:
        response_text: Teks yang dihasilkan oleh model LLM.
        user_query: Pertanyaan asli pengguna.

    Returns:
        String respons yang telah disaring dan aman untuk ditampilkan.
    """
    cleaned = response_text.strip()
    # Jangan tampilkan klaim fashion meski model mengabaikan batas domain.
    if is_fashion_request(user_query) or is_fashion_request(cleaned) or re.search(
        r"\b(?:kami|topshop|toko)\b.{0,100}\b(?:menjual|menyediakan|punya|koleksi|stok)\b.{0,60}\b(?:baju|gamis|kebaya|dress|pakaian|busana)\b",
        cleaned, re.IGNORECASE | re.DOTALL,
    ):
        return DOMAIN_REFUSAL

    # Klaim jaminan universal tidak bisa dibuktikan dari tag katalog.
    if re.search(r"\b(?:dijamin (?:aman|cocok)|pasti (?:aman|cocok)|aman (?:untuk|bagi) semua|tanpa (?:risiko|memicu) iritasi|bebas (?:alergi|iritasi))\b", cleaned, re.IGNORECASE):
        cleaned = ("Kak, kecocokan dan keamanan produk untuk setiap orang tidak bisa dijamin dari data katalog. "
                   "Periksa label dan daftar INCI lengkap, terutama jika memiliki alergi atau kulit sensitif.")

    # 1. Hapus jika ada kebocoran instruksi sistem (system prompt leak)
    cleaned = re.sub(r"(?i)system\s*prompt:?", "", cleaned)
    cleaned = re.sub(r"(?i)instruksi\s*internal:?", "", cleaned)
    cleaned = re.sub(r"(?i)kandidat\s*produk\s*tersedia:?", "", cleaned)

    # 2. Hapus simbol markdown bold (**) agar tampilan bersih dan alami
    cleaned = re.sub(r"\*\*(.*?)\*\*", r"\1", cleaned)
    cleaned = cleaned.replace("**", "")

    # 3. Cek apakah konteks membutuhkan disclaimer medis
    sensitive_keywords = ["infeksi", "iritasi parah", "luka", "alergi berat", "dermatitis", "eksim", "bengkak"]
    needs_disclaimer = any(w in user_query.lower() or w in cleaned.lower() for w in sensitive_keywords)

    if needs_disclaimer and "dermatologis" not in cleaned.lower() and "dokter" not in cleaned.lower():
        cleaned += MEDICAL_DISCLAIMER

    return cleaned
