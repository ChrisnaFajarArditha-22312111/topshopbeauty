"""
analyzer.py — Query Analyzer untuk Ekstraksi Parameter Kecantikan
Mengekstrak tipe kulit, masalah kulit, kategori produk, dan batas harga dari bahasa natural user
"""
import re
from typing import Optional, List
from pydantic import BaseModel


class QueryAnalysisResult(BaseModel):
    raw_query: str
    skin_type: Optional[str] = None
    skin_concerns: List[str] = []
    product_category: Optional[str] = None
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    keywords: List[str] = []
    is_product_request: bool = False       # True jika user meminta rekomendasi / info produk
    needs_clarification: bool = False      # True jika query ambigu dan perlu klarifikasi
    clarification_question: Optional[str] = None  # Pertanyaan klarifikasi yang harus diajukan


SKIN_TYPE_MAPPINGS = {
    "oily": "Oily",
    "berminyak": "Oily",
    "minyak": "Oily",
    "dry": "Dry",
    "kering": "Dry",
    "dehidrasi": "Dry",
    "sensitive": "Sensitive",
    "sensitif": "Sensitive",
    "combination": "Combination",
    "kombinasi": "Combination",
    "normal": "Normal",
    "semua jenis kulit": "All Skin Types",
}

SKIN_CONCERN_MAPPINGS = {
    # Jerawat & bruntusan -> 'Acne & Blemish'
    "jerawat": "Acne",
    "berjerawat": "Acne",
    "acne": "Acne",
    "bruntusan": "Acne",
    "komedo": "Pores",
    "pori": "Pores",
    "pori-pori": "Pores",
    "pori besar": "Pores",
    # Mencerahkan & flek -> 'Dullness', 'Dark Spots & PIH', 'Uneven Skin Tone'
    "kusam": "Dullness",
    "mencerahkan": "Dullness",
    "flek": "Dark Spots",
    "dark spots": "Dark Spots",
    "bintik hitam": "Dark Spots",
    "noda hitam": "Dark Spots",
    "bekas jerawat": "Dark Spots",
    "belang": "Uneven",
    "warna kulit tidak merata": "Uneven",
    # Hidrasi & kering -> 'Hydration', 'Dehydration & Dryness', 'Dry Flaky Skin'
    "kering": "Dry",
    "dehidrasi": "Dry",
    "lembab": "Hydration",
    "hidrasi": "Hydration",
    # Skin barrier -> 'Damaged Skin Barrier'
    "barrier": "Barrier",
    "skin barrier": "Barrier",
    "skin barrier rusak": "Barrier",
    # Minyak berlebih -> 'Excess Oil', 'Excess Shine / Oil'
    "minyak": "Excess Oil",
    "berminyak": "Excess Oil",
    "kilang minyak": "Excess Oil",
    # Penuaan & kerutan -> 'Anti-Aging', 'Fine Lines & Wrinkles'
    "kerutan": "Fine Lines",
    "garis halus": "Fine Lines",
    "penuaan": "Anti-Aging",
    "anti aging": "Anti-Aging",
    "keriput": "Fine Lines",
    # Kemerahan & iritasi -> 'Redness'
    "kemerahan": "Redness",
    "iritasi": "Redness",
    # Sunburn / proteksi UV -> 'UV Protection & Sunburn'
    "sunburn": "Sunburn",
    "terbakar matahari": "Sunburn",
    "gosong": "Sunburn",
}

CATEGORY_KEYWORDS = {
    "sunscreen": "Sunscreen",
    "tabir surya": "Sunscreen",
    "serum": "Serum",
    "toner": "Toner",
    "cleanser": "Cleanser",
    "facial wash": "Cleanser",
    "sabun muka": "Cleanser",
    "sabun wajah": "Cleanser",
    "micellar": "Cleanser",
    "moisturizer": "Moisturizer",
    "pelembab": "Moisturizer",
    "pelembap": "Moisturizer",
    "cushion": "Make Up",
    "bedak": "Make Up",
    "lipstik": "Lip",
    "lipstick": "Lip",
    "lip tint": "Lip",
    "lip cream": "Lip",
    "masker": "Mask",
    "body lotion": "Body Care",
    "body wash": "Body Care",
    "sabun mandi": "Body Care",
    "scrub": "Body Care",
    "deodorant": "Body Care",
    "shampoo": "Hair Care",
    "skincare": "Skincare",
    "skin care": "Skincare",
    "perawatan wajah": "Skincare",
}

# Kata kunci yang mengindikasikan user meminta rekomendasi / info produk spesifik
PRODUCT_REQUEST_PATTERNS = [
    r"\b(rekomen(dasi)?|sarankan|rekomen|suggest)\b",
    r"\b(produk\s+(apa|yang|untuk|terbaik|bagus)|apa\s+produk)\b",
    r"\b(mau\s+beli|pengen\s+beli|ingin\s+beli|cari\s+produk)\b",
    r"\b(ada\s+(produk|sunscreen|serum|toner|moisturizer|cleanser|pelembap|sabun|skincare))\b",
    r"\b(sunscreen|serum|toner|cleanser|moisturizer|pelembap|pelembab|sabun\s+muka|facial\s+wash|cushion|bedak|lipstik|masker|skincare|body\s*lotion)\b",
    r"\b(yang\s+(bagus|cocok|tepat|efektif|ampuh|aman)(\s+(untuk|buat|bagi))?)\b",
    r"\b(harga|budget|duit|uang|murah|terjangkau|di\s+bawah|maksimal)\b",
    r"\b(brand|merk|merek)\s+(apa|yang)\b",
    r"\b(wardah|garnier|eminia|somethinc|scarlett|azarine|skintific|npure|avoskin|ms\s+glow|originote|facetology)\b",
    # Intent pencarian implisit: "lagi cari", "nyari", "cari yang cocok", "mau nyoba"
    r"\b(lagi\s+cari|nyari|lagi\s+nyari|cari(-cari)?|mau\s+nyoba|pengen\s+nyoba)\b",
    r"\b(bisa\s+rekomen|bantu\s+cariin|cariin|suggest(kan)?)\b",
    r"\b(kulit\s+(berminyak|kering|sensitif|kombinasi|normal|acne|jerawat))\b",
    r"\b(jerawat|bruntusan|kusam|flek|komedo|bekas\s*jerawat)\b",
]


def _detect_product_request(
    query: str,
    skin_type: Optional[str] = None,
    skin_concerns: List[str] = None,
    category: Optional[str] = None,
    max_price: Optional[float] = None,
) -> bool:
    """
    Menentukan apakah pesan user adalah permintaan rekomendasi / informasi produk.
    Jika ada entity terdeteksi (tipe kulit, concern, kategori, atau budget), otomatis dianggap product request.
    """
    if category or (skin_concerns and len(skin_concerns) > 0) or max_price:
        return True
    if skin_type:
        return True

    lower_q = query.lower()
    for pattern in PRODUCT_REQUEST_PATTERNS:
        if re.search(pattern, lower_q, re.IGNORECASE):
            return True
    return False


def analyze_user_query(query: str) -> QueryAnalysisResult:
    """
    Menganalisis teks pertanyaan pengguna untuk mengekstrak entitas kecantikan terstruktur.
    """
    lower_q = query.lower()

    # 1. Ekstraksi Tipe Kulit
    detected_skin_type = None
    for kw, st in SKIN_TYPE_MAPPINGS.items():
        if re.search(r"\b" + re.escape(kw) + r"\b", lower_q):
            detected_skin_type = st
            break

    # 2. Ekstraksi Skin Concerns
    detected_concerns = []
    for kw, sc in SKIN_CONCERN_MAPPINGS.items():
        if re.search(r"\b" + re.escape(kw) + r"\b", lower_q):
            if sc not in detected_concerns:
                detected_concerns.append(sc)

    # 3. Ekstraksi Kategori Produk
    detected_category = None
    for kw, cat in CATEGORY_KEYWORDS.items():
        if re.search(r"\b" + re.escape(kw) + r"\b", lower_q):
            detected_category = cat
            break

    # 4. Ekstraksi Batas Harga (misal: "di bawah 50 ribu", "maksimal 100k", "< 40.000", "harga 50rb", "duit 100 ribu")
    detected_max_price = None
    price_pattern = r"(?:di\s*bawah|kurang\s*dari|maksimal|max|<|harga|duit|uang|budget|punya\s*duit)\s*(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(ribu|rb|k|jt|juta)?"
    match = re.search(price_pattern, lower_q)
    if match:
        num_str = match.group(1).replace(".", "").replace(",", "")
        unit = match.group(2)
        try:
            val = float(num_str)
            if unit in ["ribu", "rb", "k"]:
                val *= 1000
            elif unit in ["jt", "juta"]:
                val *= 1000000
            elif val < 500:
                val *= 1000
            detected_max_price = val
        except ValueError:
            pass
    elif re.search(r"\b(\d+)\s*(ribu|rb|k)\b", lower_q):
        # Pola sederhana angka + ribu/k: misal "100 ribu", "50rb"
        m_simple = re.search(r"\b(\d+)\s*(ribu|rb|k)\b", lower_q)
        if m_simple:
            try:
                detected_max_price = float(m_simple.group(1)) * 1000
            except ValueError:
                pass

    # 5. Deteksi intent: apakah user meminta rekomendasi / info produk?
    is_product_request = _detect_product_request(
        query,
        skin_type=detected_skin_type,
        skin_concerns=detected_concerns,
        category=detected_category,
        max_price=detected_max_price,
    )

    # 6. Deteksi ambiguitas — klarifikasi HANYA jika query benar-benar kosong konteks
    # (misal hanya bilang "rekomendasi dong" tanpa menyebut tipe kulit, concern, kategori, maupun budget)
    needs_clarification = False
    clarification_question = None

    has_any_context = bool(detected_skin_type or detected_concerns or detected_category or detected_max_price)

    # Hanya tanya klarifikasi jika user meminta produk tetapi sama sekali tidak ada konteks apapun
    if is_product_request and not has_any_context:
        # Cek apakah hanya sapaan murni tanpa detail
        needs_clarification = True
        clarification_question = (
            "Tentu Kak, dengan senang hati! \U0001F338 Supaya saya bisa memberikan rekomendasi produk yang paling tepat dan cocok, "
            "boleh ceritakan jenis kulit Kakak (berminyak, kering, sensitif, atau kombinasi), atau ada masalah kulit tertentu yang sedang ingin diatasi? \u2728"
        )

    return QueryAnalysisResult(
        raw_query=query,
        skin_type=detected_skin_type,
        skin_concerns=detected_concerns,
        product_category=detected_category,
        max_price=detected_max_price,
        keywords=[w for w in lower_q.split() if len(w) > 3],
        is_product_request=is_product_request,
        needs_clarification=needs_clarification,
        clarification_question=clarification_question,
    )
