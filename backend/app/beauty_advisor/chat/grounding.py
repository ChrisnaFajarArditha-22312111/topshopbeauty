"""Rangkai fakta produk dari katalog, bukan klaim bebas model."""
import json
import re


def select_grounded_products(raw_response: str, candidates: list) -> list:
    """Model hanya boleh memilih nomor kandidat yang benar-benar tersedia."""
    try:
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw_response.strip())
        numbers = json.loads(cleaned)["selected_product_numbers"]
        if not isinstance(numbers, list):
            return candidates
        selected = []
        for number in numbers:
            if type(number) is int and 1 <= number <= len(candidates) and candidates[number - 1] not in selected:
                selected.append(candidates[number - 1])
        return selected or candidates
    except (ValueError, KeyError, TypeError):
        return candidates


def format_catalog_reply(candidates: list) -> str:
    if not candidates:
        return ("Maaf Kak, belum ada produk dengan data katalog yang memenuhi seluruh kriteria tersebut. "
                "Saya tidak akan menggantinya dengan kategori atau harga lain. Kakak bisa mengubah budget atau kriteria pencarian.")
    descriptions = []
    for p in candidates:
        price = f"{float(p.harga):,.0f}".replace(",", ".")
        kind = p.sub_category.name if p.sub_category else (p.category.name if p.category else "jenis belum tersedia")
        ingredients = ", ".join(i.name for i in p.ingredients[:5]) if p.ingredients else "belum tersedia"
        descriptions.append(f"{p.nama_produk} (Rp{price}; kategori {kind}). Data bahan yang tercatat: {ingredients}.")
    return ("Berikut pilihan dari katalog yang memenuhi filter Kakak: " + " ".join(descriptions)
            + "\n\nData bahan ini belum tentu daftar INCI lengkap. Kecocokan individual tidak dapat dipastikan hanya dari tag tipe kulit; "
              "kecocokan, sertifikasi, dan detail perlindungan UV perlu diperiksa pada label resmi masing-masing produk.")
