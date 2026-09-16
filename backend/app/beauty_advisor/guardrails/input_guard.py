"""
input_guard.py — Input Guardrail untuk AI Beauty Advisor
Memastikan pertanyaan pengguna tetap dalam batas domain kosmetik & skincare,
serta menangkal prompt injection dan konten terlarang/tidak relevan.
"""
import re
from typing import Optional
from pydantic import BaseModel


class InputGuardResult(BaseModel):
    is_valid: bool
    refusal_message: Optional[str] = None


# Kata kunci atau topik yang dilarang (out-of-domain)
OUT_OF_DOMAIN_PATTERNS = [
    r"\b(python|javascript|java|kotlin|golang|coding|pemrograman|html|css|sql|script|code|algoritma|quicksort|sorting algorithm)\b",
    r"\b(matematika|kalkulus|rumus|integral|hitung nilai|persamaan)\b",
    r"\b(resep masakan|cara memasak|bahan kue|bumbu rendang)\b",
    r"\b(politik|pemilu|partai|presiden|debat pilkada|menteri)\b",
    r"\b(ignore previous instructions|abaikan instruksi sebelumnya|jailbreak|bypass)\b",
    r"\b(resep dokter|obat keras|antibiotik oral|kortikosteroid minum)\b",
]

# Kata kunci domain kecantikan yang valid (termasuk budget, tipe kulit, area tubuh, dan istilah perawatan)
BEAUTY_DOMAIN_KEYWORDS = [
    "kulit", "wajah", "muka", "tubuh", "badan", "bibir", "mata", "alis", "rambut", "leher", "tangan", "kaki",
    "jerawat", "acne", "bruntusan", "kusam", "flek", "kering", "berminyak", "oily", "kombinasi", "sensitif",
    "komedo", "pori", "bopeng", "kemerahan", "iritasi", "glowing", "mencerahkan", "cerah", "kerutan", "penuaan",
    "skincare", "skin care", "kosmetik", "serum", "toner", "sunscreen", "pelembap", "moisturizer", "cleanser",
    "sabun", "facial wash", "face wash", "lipstik", "lip cream", "lip tint", "cushion", "bedak", "foundation",
    "parfum", "makeup", "make up", "masker", "body lotion", "body wash", "scrub", "lulur", "deodorant",
    "retinol", "niacinamide", "salicylic", "hyaluronic", "vitamin c", "vitamin e", "ceramide", "cica", "centella", "spf",
    "rekomendasi", "produk", "wardah", "garnier", "emina", "somethinc", "scarlett", "azarine", "skintific", "originote",
    "harga", "murah", "bagus", "cocok", "topshop", "aman", "ampuh", "cari", "beli", "butuh", "pakai", "saran",
    # Budget, nominal uang, dan ekspresi harga
    "duit", "uang", "budget", "anggaran", "dana", "ribu", "rb", "k", "jt", "juta", "rp", "rupiah", "ratus", "seratus",
    "puluh", "goceng", "ceban", "gocap", "terjangkau", "hemat", "kantong", "pelajar",
    # Identitas toko, lokasi, dan keaslian Topshop Lampung
    "topshop", "toko", "store", "offline", "lokasi", "alamat", "lampung", "bandar lampung", "buka", "tutup", "jam",
    "ori", "original", "asli", "bpom", "halal", "resmi", "stok", "ready", "garansi",
    # Transaksi, belanja, pengiriman, dan pembayaran
    "bayar", "pembayaran", "cara bayar", "transfer", "qris", "rekening", "bank", "cod",
    "pesan", "pesanan", "order", "checkout", "beli", "keranjang",
    "ongkir", "ongkos kirim", "kirim", "pengiriman", "ekspedisi", "gosend", "grab", "kurir",
]

# --------------------------------------------------------------------------
# Pola sapaan / greeting ringan — short-circuit dengan sambutan ramah
# (tanpa pipeline RAG & rekomendasi produk)
# --------------------------------------------------------------------------
GREETING_PATTERNS = [
    r"^(halo|hallo|hai|hi|hey|hello|hei)[\s!?.]*$",
    r"^(selamat\s+(pagi|siang|sore|malam|datang))[\s!?.]*$",
    r"^(tes|test|coba|testing|cobain|ping)[\s!?.]*$",
    r"^[a-z]{1}$",                          # single character
    r"^[^a-zA-Z\u00C0-\u024F]{1,5}$",       # emoji atau simbol pendek saja
]

GREETING_RESPONSE = (
    "Halo Kak! \U0001F44B Selamat datang di Topshop Kosmetik Bandar Lampung. \U0001F338 "
    "Saya siap membantu konsultasi skincare dan rekomendasi produk kecantikan untuk Kakak. "
    "Boleh ceritakan jenis kulit, masalah kulit yang ingin diatasi, atau budget yang Kakak miliki "
    "supaya saya bisa merekomendasikan produk yang paling tepat! \u2728"
)

# --------------------------------------------------------------------------
# Pola chitchat / pertanyaan percakapan umum — diteruskan ke LLM secara langsung
# supaya LLM menjawab secara natural, TANPA pipeline RAG & rekomendasi produk.
# --------------------------------------------------------------------------
CHITCHAT_PATTERNS = [
    # Pertanyaan kapabilitas / identitas
    r"\b(kamu\s+bisa\s+(apa|ngapain)|bisa\s+apa\s+saja|apa\s+(yang\s+)?bisa\s+kamu|kemampuanmu|fungsimu)\b",
    r"\b(siapa\s+kamu|kamu\s+siapa|kamu\s+itu\s+apa|apa\s+itu\s+topshop|perkenalkan\s+dirimu)\b",
    r"\b(kamu\s+(dari|buatan|dibuat)\s+(mana|siapa|apa)|siapa\s+(yang\s+)?buat\s+kamu)\b",
    # Pertanyaan bantuan umum
    r"\b(gimana\s+cara\s+pakai|cara\s+penggunaan|bagaimana\s+caranya|langkah[\s-]langkah)\b",
    r"\b(ada\s+(yang\s+)?bisa\s+dibantu|bisa\s+bantu|mau\s+tanya|mau\s+konsultasi)\b",
    # Ungkapan sopan
    r"\b(terima\s+kasih|makasih|thanks|thank\s+you|thx|oke\s+makasih|oke\s+terima\s+kasih)\b",
    r"\b(oke|ok|baik|siap|paham|ngerti|mengerti|oke\s+kak|oke\s+deh)\b",
    r"\b(boleh\s+tanya|mau\s+nanya|boleh\s+saya\s+tanya)\b",
]

CHITCHAT_RESPONSE = (
    "Tentu Kak! \U0001F338 Saya adalah Topshop Beauty Advisor, asisten konsultasi kecantikan dari Topshop Kosmetik Bandar Lampung. "
    "Saya bisa membantu Kakak untuk konsultasi jenis kulit, merekomendasikan produk skincare dan makeup sesuai kebutuhan dan budget, "
    "menyusun skincare routine pagi dan malam, memberikan solusi untuk masalah kulit seperti jerawat, kusam, atau flek, "
    "serta menjelaskan kandungan bahan aktif seperti niacinamide, retinol, vitamin C, dan lainnya. "
    "Mau mulai konsultasi dari mana, Kak? \U0001F60A"
)


def check_input_guard(query: str) -> InputGuardResult:
    """
    Memeriksa pertanyaan input dari pengguna sebelum diproses ke LLM.

    Alur pemeriksaan:
    1. Panjang minimum — tolak jika terlalu pendek
    2. Greeting / sapaan ringan — short-circuit dengan pesan sambutan (tanpa RAG)
    3. Chitchat / percakapan umum — short-circuit dengan penjelasan kapabilitas (tanpa RAG)
    4. Out-of-domain eksplisit — tolak dengan pesan maaf
    5. Relevansi kata kunci beauty — tolak jika kalimat panjang dan tidak relevan

    Args:
        query: Teks pertanyaan dari pengguna.

    Returns:
        InputGuardResult dengan is_valid=True jika query boleh dilanjutkan ke pipeline LLM,
        atau is_valid=False beserta refusal_message jika tidak (termasuk greeting & chitchat).
    """
    clean_query = query.lower().strip()

    # 1. Cek panjang query minimum
    if len(clean_query) < 2:
        return InputGuardResult(
            is_valid=False,
            refusal_message=(
                "Pertanyaan terlalu pendek. Silakan ceritakan jenis kulit atau produk "
                "yang Anda cari ya Kak. \U0001F338"
            ),
        )

    # 2. Deteksi sapaan / greeting ringan — bypass pipeline RAG & rekomendasi produk
    for pattern in GREETING_PATTERNS:
        if re.search(pattern, clean_query, re.IGNORECASE):
            return InputGuardResult(
                is_valid=False,
                refusal_message=GREETING_RESPONSE,
            )

    # 3. Deteksi chitchat / pertanyaan percakapan umum — bypass pipeline RAG & rekomendasi produk
    for pattern in CHITCHAT_PATTERNS:
        if re.search(pattern, clean_query, re.IGNORECASE):
            return InputGuardResult(
                is_valid=False,
                refusal_message=CHITCHAT_RESPONSE,
            )

    # 4. Cek apakah terdapat pola out-of-domain eksplisit
    for pattern in OUT_OF_DOMAIN_PATTERNS:
        if re.search(pattern, clean_query, re.IGNORECASE):
            return InputGuardResult(
                is_valid=False,
                refusal_message=(
                    "Maaf ya Kak, sebagai Beauty Advisor Topshop Kosmetik, saya hanya dapat membantu "
                    "konsultasi dan rekomendasi produk seputar kecantikan, kosmetik, dan perawatan kulit (skincare). \U0001F338\u2728"
                ),
            )

    # 5. Cek relevansi kata kunci kecantikan & penyebutan nominal budget/harga
    has_price = bool(
        re.search(r"(?:rp\.?\s*)?\d+\s*(?:ribu|rb|k|jt|juta)?\b", clean_query)
        or re.search(r"\b(seratus|dua\s*ratus|tiga\s*ratus|lima\s*puluh)\s*(ribu|rb|k)?\b", clean_query)
    )
    is_relevant = has_price or any(kw in clean_query for kw in BEAUTY_DOMAIN_KEYWORDS)
    if not is_relevant and len(clean_query.split()) > 3:
        # Jika kalimat lebih dari 3 kata dan tidak ada satu pun kata kunci relevan
        return InputGuardResult(
            is_valid=False,
            refusal_message=(
                "Maaf ya Kak, sebagai Beauty Advisor Topshop Kosmetik, saya hanya dapat membantu "
                "konsultasi dan rekomendasi seputar kecantikan dan kosmetik. "
                "Boleh diceritakan tipe kulit, masalah wajah, atau produk yang ingin Anda tanyakan? \U0001F338"
            ),
        )

    return InputGuardResult(is_valid=True, refusal_message=None)
