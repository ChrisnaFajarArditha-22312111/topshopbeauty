"""
enrich_products.py — Skrip untuk memperkaya key_ingredients pada seluruh 1000 produk di products.json
dan memperbarui search_document agar sinkron dengan fitur AI Beauty Advisor & RAG.
"""
import json
import re
import os

SPECIFIC_PATTERNS = [
    # Asam & Eksfoliator
    (r'\b(salicylic\s*acid|bha)\b', 'Salicylic Acid'),
    (r'\b(glycolic\s*acid|lactic\s*acid|mandelic\s*acid|aha)\b', 'AHA (Glycolic/Lactic Acid)'),
    (r'\b(pha|lactobionic)\b', 'PHA'),
    (r'\b(kojic\s*acid|kojic)\b', 'Kojic Acid'),
    (r'\b(tranexamic\s*acid|tranexamic)\b', 'Tranexamic Acid'),
    (r'\b(azelaic\s*acid|azeclair)\b', 'Azelaic Acid'),
    
    # Vitamin & Pencerah
    (r'\b(niacinamide|vitamin\s*b3|vit\s*b3)\b', 'Niacinamide'),
    (r'\b(vitamin\s*c|vit\s*c|ascorbic|ethyl\s*ascorbic)\b', 'Vitamin C'),
    (r'\b(vitamin\s*e|vit\s*e|tocopherol|tocopheryl)\b', 'Vitamin E'),
    (r'\b(panthenol|vitamin\s*b5|vit\s*b5)\b', 'Panthenol (Vitamin B5)'),
    (r'\b(retinol|retinoid|retinyl|hpr)\b', 'Retinol'),
    (r'\b(bakuchiol)\b', 'Bakuchiol'),
    (r'\b(alpha\s*arbutin|arbutin)\b', 'Alpha Arbutin'),
    (r'\b(glutathione|gluta)\b', 'Glutathione'),
    (r'\b(symwhite|377|phenylethyl\s*resorcinol)\b', 'SymWhite 377'),
    (r'\b(biotin|vitamin\s*b7)\b', 'Biotin'),
    
    # Skin Barrier & Hidrasi
    (r'\b(5x\s*ceramide|ceramide|ceramides|ceramide\s*np)\b', 'Ceramide'),
    (r'\b(hyaluronic\s*acid|hyaluronic|hyaluron|sodium\s*hyaluronate|4d\s*hyaluronic)\b', 'Hyaluronic Acid'),
    (r'\b(amino\s*acid|amino)\b', 'Amino Acid'),
    (r'\b(peptide|peptides|peptida)\b', 'Peptide'),
    (r'\b(collagen|kolagen)\b', 'Collagen'),
    (r'\b(allantoin)\b', 'Allantoin'),
    (r'\b(squalane|squalene)\b', 'Squalane'),
    (r'\b(glycerin|gliserin)\b', 'Glycerin'),
    
    # Ekstrak Tumbuhan & Alami
    (r'\b(centella\s*asiatica|centella|cica|madecassoside)\b', 'Centella Asiatica (Cica)'),
    (r'\b(mugwort|artemisia)\b', 'Mugwort Extract'),
    (r'\b(tea\s*tree|melaleuca)\b', 'Tea Tree Oil'),
    (r'\b(green\s*tea|matcha|camellia\s*sinensis)\b', 'Green Tea Extract'),
    (r'\b(aloe\s*vera|aloe|lidah\s*buaya)\b', 'Aloe Vera Extract'),
    (r'\b(propolis|honey|madu|bee\s*venom)\b', 'Propolis & Honey Extract'),
    (r'\b(calendula|marigold)\b', 'Calendula Extract'),
    (r'\b(rose\s*water|rose\s*oil|rose|mawar)\b', 'Rose Extract'),
    (r'\b(rice\s*extract|rice|beras)\b', 'Rice Bran Extract'),
    (r'\b(pomegranate|delima)\b', 'Pomegranate Extract'),
    (r'\b(chamomile|matricaria)\b', 'Chamomile Extract'),
    (r'\b(licorice|akar\s*manis)\b', 'Licorice Extract'),
    (r'\b(bengkoang|bengkuang)\b', 'Bengkoang Extract'),
    (r'\b(papaya|pepaya)\b', 'Papaya Extract (Papain)'),
    (r'\b(herba\s*matsu|matsu)\b', 'Herba Matsu Oil'),
    (r'\b(sakura|cherry\s*blossom)\b', 'Sakura Extract'),
    (r'\b(lemon|citrus|jeruk)\b', 'Lemon Extract'),
    (r'\b(ginseng|panax)\b', 'Panax Ginseng Extract'),
    (r'\b(snail\s*mucin|snail|siput)\b', 'Snail Mucin Filtrate'),
    (r'\b(charcoal|arang|bambu)\b', 'Activated Charcoal'),
    (r'\b(kaolin|clay|lumpur)\b', 'Kaolin Clay'),
    (r'\b(sulfur|belerang)\b', 'Sulfur'),
    (r'\b(witch\s*hazel|hamamelis)\b', 'Witch Hazel Extract'),
    (r'\b(spirulina)\b', 'Spirulina Extract'),
    
    # Minyak & Butter Alami
    (r'\b(jojoba\s*oil|jojoba)\b', 'Jojoba Oil'),
    (r'\b(argan\s*oil|argan)\b', 'Argan Oil'),
    (r'\b(olive\s*oil|olive|zaitun)\b', 'Olive Oil'),
    (r'\b(shea\s*butter)\b', 'Shea Butter'),
    (r'\b(kemiri|candlenut)\b', 'Minyak Kemiri'),
    (r'\b(coconut\s*oil|kelapa)\b', 'Virgin Coconut Oil'),
    (r'\b(sunflower\s*seed\s*oil|sunflower)\b', 'Sunflower Seed Oil'),
    (r'\b(castor\s*oil|jarak)\b', 'Castor Oil'),
    (r'\b(almond\s*oil|almond)\b', 'Sweet Almond Oil'),
    
    # Mineral & Proteksi UV
    (r'\b(sunscreen|sunblock|uv\s*shield|spf|tabir\s*surya)\b', 'UV Filter (SPF Broad Spectrum)'),
    (r'\b(zinc\s*oxide|zinc\s*pca|zinc)\b', 'Zinc PCA & Zinc Oxide'),
    (r'\b(titanium\s*dioxide)\b', 'Titanium Dioxide'),
    (r'\b(keratin)\b', 'Keratin Protein'),
]

SERIES_BRAND_DEFAULTS = [
    (r'skintific.*5x\s*ceramide', ['Ceramide', 'Hyaluronic Acid', 'Centella Asiatica (Cica)']),
    (r'skintific.*mugwort', ['Mugwort Extract', 'Niacinamide', 'Salicylic Acid', 'Centella Asiatica (Cica)']),
    (r'skintific.*symwhite|skintific.*377', ['SymWhite 377', 'Niacinamide', 'Tranexamic Acid']),
    (r'skintific.*glycolic', ['AHA (Glycolic/Lactic Acid)', 'Niacinamide', 'Centella Asiatica (Cica)']),
    (r'skintific.*panthenol', ['Panthenol (Vitamin B5)', 'Centella Asiatica (Cica)', 'Allantoin']),
    
    (r'the\s*originote.*hyalucera', ['Hyaluronic Acid', 'Ceramide', 'Centella Asiatica (Cica)']),
    (r'the\s*originote.*bha|the\s*originote.*peeling', ['Salicylic Acid', 'AHA (Glycolic/Lactic Acid)', 'PHA']),
    (r'the\s*originote.*lash|the\s*originote.*brow', ['Biotin', 'Peptide', 'Panax Ginseng Extract']),
    (r'the\s*originote.*gluta', ['Glutathione', 'Niacinamide', 'Vitamin C']),
    
    (r'azarine.*barrier', ['Ceramide', 'Centella Asiatica (Cica)', 'Panthenol (Vitamin B5)']),
    (r'azarine.*calm\s*my\s*acne', ['Bakuchiol', 'Tea Tree Oil', 'Centella Asiatica (Cica)']),
    (r'azarine.*sunscreen|azarine.*hydrasoothe', ['UV Filter (SPF Broad Spectrum)', 'Aloe Vera Extract', 'Green Tea Extract', 'Niacinamide']),
    (r'azarine.*cicamide', ['Centella Asiatica (Cica)', 'Ceramide', 'Niacinamide']),
    
    (r'wardah.*uv\s*shield', ['UV Filter (SPF Broad Spectrum)', 'Vitamin C', 'Vitamin E', 'Bisabolol']),
    (r'wardah.*lightening', ['Niacinamide', 'Licorice Extract', 'Vitamin E']),
    (r'wardah.*renew\s*you', ['Peptide', 'Bakuchiol', 'Microcapsule Retinol']),
    (r'wardah.*acnederm', ['Salicylic Acid', 'Tea Tree Oil', 'Allantoin']),
    (r'wardah.*hydra\s*rose', ['Rose Extract', 'Hyaluronic Acid', 'Glycerin']),
    (r'wardah.*cica|wardah.*aloe', ['Centella Asiatica (Cica)', 'Aloe Vera Extract', 'Vitamin E']),
    
    (r'scarlet.*body\s*lotion|scarlet.*body\s*serum', ['Glutathione', 'Vitamin E', 'Niacinamide', 'Kojic Acid']),
    (r'scarlet.*acne', ['Tea Tree Oil', 'Salicylic Acid', 'Centella Asiatica (Cica)']),
    (r'scarlet.*brightly', ['Niacinamide', 'Glutathione', 'Vitamin C']),
    
    (r'garnier.*micellar', ['Micellar Cleansing Agents', 'Glycerin', 'Rose Extract']),
    (r'garnier.*bright\s*complete', ['Vitamin C', 'Lemon Extract', 'Salicylic Acid']),
    (r'garnier.*sakura', ['Sakura Extract', 'Hyaluronic Acid', 'Niacinamide']),
    
    (r'shinzui', ['Herba Matsu Oil', 'Sakura Extract', 'Vitamin C']),
    (r'herborist.*juice', ['Vitamin E', 'Pomegranate Extract', 'Apple Extract']),
    (r'herborist.*zaitun', ['Olive Oil', 'Vitamin E', 'Collagen']),
    (r'viva.*milk\s*cleanser|viva.*face\s*toner', ['Bengkoang Extract', 'Rose Extract', 'Green Tea Extract']),
    (r'hanasui.*flawless', ['Niacinamide', 'Licorice Extract', 'Vitamin E']),
    (r'hanasui.*serum', ['Niacinamide', 'Vitamin C', 'Collagen', 'Zinc PCA & Zinc Oxide']),
    (r'you.*hy!\s*amino', ['Amino Acid', 'Hyaluronic Acid', 'Centella Asiatica (Cica)']),
    (r'emina.*bright\s*stuff', ['Summer Plum Extract', 'Niacinamide', 'Vitamin E']),
    (r'emina.*ms\s*pimple', ['Salicylic Acid', 'Rosebay Willowherb', 'Zinc PCA & Zinc Oxide']),
    (r'emina.*sun\s*battle', ['UV Filter (SPF Broad Spectrum)', 'Aloe Vera Extract', 'Vitamin E']),
]

CATEGORY_DEFAULTS = {
    'Skincare/Sunscreen': ['UV Filter (SPF Broad Spectrum)', 'Vitamin E', 'Niacinamide'],
    'Skincare/Serum & Ampoule': ['Niacinamide', 'Hyaluronic Acid', 'Vitamin C'],
    'Skincare/Moisturizer': ['Ceramide', 'Hyaluronic Acid', 'Glycerin'],
    'Skincare/Facial Wash': ['Glycerin', 'Aloe Vera Extract', 'Centella Asiatica (Cica)'],
    'Skincare/Makeup Remover & Cleanser': ['Micellar Cleansing Agents', 'Glycerin', 'Rose Extract'],
    'Skincare/Toner & Essence': ['Centella Asiatica (Cica)', 'Hyaluronic Acid', 'Witch Hazel Extract'],
    'Skincare/Face Mask & Peeling': ['Kaolin Clay', 'Tea Tree Oil', 'Centella Asiatica (Cica)'],
    'Skincare/Face Care': ['Niacinamide', 'Vitamin E', 'Hyaluronic Acid'],
    
    'Body Care/Body Lotion & Serum': ['Glutathione', 'Niacinamide', 'Vitamin E'],
    'Body Care/Body Scrub': ['Rice Bran Extract', 'Olive Oil', 'Vitamin E'],
    'Body Care/Deodorant': ['Aluminum Chlorohydrate', 'Niacinamide', 'Allantoin'],
    
    'Hair Care/Hair Treatment': ['Keratin Protein', 'Argan Oil', 'Biotin', 'Minyak Kemiri'],
    
    'Makeup/Lip Product': ['Vitamin E', 'Jojoba Oil', 'Shea Butter'],
    'Makeup/Face Base (Foundation/Cushion)': ['Titanium Dioxide', 'Vitamin E', 'Niacinamide'],
    'Makeup/Face Powder': ['Talc', 'Zinc PCA & Zinc Oxide', 'Vitamin E'],
    'Makeup/Mascara': ['Beeswax', 'Castor Oil', 'Vitamin E'],
    'Makeup/Eyeliner': ['Castor Oil', 'Beeswax', 'Iron Oxides'],
    'Makeup/Eyebrow': ['Castor Oil', 'Hydrogenated Vegetable Oil', 'Vitamin E'],
    
    'Fragrance/Perfume & Fragrance': ['Fragrance (Parfum)', 'Aqua', 'Alcohol Denat'],
    'Tools & Accessories/Beauty Tools': ['High Grade Synthetic Bristles / Cotton / Polyurethane Sponge'],
    'Packaging/Packaging & Shipping': ['Eco-friendly Recycled Cardboard & Polyethylene Protection'],
}

def rebuild_search_document(p: dict) -> str:
    nama = p.get('nama_produk', '')
    brand = p.get('brand', '')
    cat = p.get('category', '')
    subcat = p.get('sub_category', '')
    ba = p.get('beauty_advisor', {})
    skin_types = ", ".join(ba.get('skin_types', [])) or "Semua jenis kulit"
    skin_concerns = ", ".join(ba.get('skin_concerns', [])) or "-"
    key_ings = ", ".join(ba.get('key_ingredients', [])) or "Kandungan teruji klinis"
    usage = ba.get('usage_time', 'Pagi & Malam')
    texture = ba.get('texture', 'Sesuai formula')
    harga = p.get('harga', 0)
    rating = p.get('rating', 5.0)
    terjual = p.get('terjual', 0)
    return (
        f"{nama}. Brand: {brand}. Kategori: {cat} ({subcat}). "
        f"Cocok untuk jenis kulit: {skin_types}. "
        f"Membantu mengatasi masalah: {skin_concerns}. "
        f"Kandungan aktif utama: {key_ings}. "
        f"Waktu pemakaian yang dianjurkan: {usage}. "
        f"Tekstur: {texture}. "
        f"Harga: Rp {harga:,.0f}. "
        f"Rating: {rating:.2f} dari 5, terjual {terjual} pcs."
    )

EXACT_ITEM_OVERRIDES = [
    (r'\b(softlens|contact\s*lens)\b(?!.*(air|cairan|tetes|solution))', ['PolyHEMA (Hydrogel)', 'Water 42-58%'], False, 'Aksesoris Mata'),
    (r'\b(air|cairan|tetes|solution|pembersih)\s*(softlens|contact\s*lens)\b', ['Saline Solution (Sodium Chloride)', 'Boric Acid', 'HPMC (Lubricant)'], False, 'Perawatan Softlens'),
    (r'\b(penjepit\s*softlens|alat\s*softlens)\b', ['Medical Grade Silicone & Plastic'], False, 'Alat Kecantikan'),
    (r'\b(kutek|nail\s*polish|cat\s*kuku|peel\s*off)\b', ['Butyl Acetate', 'Ethyl Acetate', 'Nitrocellulose'], False, 'Nail Care'),
    (r'\b(remover\s*kutek|pembersih\s*kutek|aseton|acetone)\b', ['Acetone / Ethyl Acetate', 'Vitamin E'], False, 'Nail Care'),
    (r'\bacnes.*(face\s*wash|facial\s*wash|creamy\s*wash)\b', ['Isopropylmethylphenol (Anti-Bakteri)', 'Salicylic Acid', 'Vitamin C & E'], True, 'Facial Wash'),
    (r'\bacnes.*(sealing\s*jell|treatment|spot)\b', ['Sulfur', 'Salicylic Acid', 'Isopropylmethylphenol'], True, 'Acne Treatment'),
    (r'\b(kapas)\b', ['100% Pure Natural Cotton'], False, 'Alat Kecantikan'),
    (r'\b(sisir|cukur|pisau\s*cukur|razor)\b', ['Stainless Steel & ABS Polymer'], False, 'Alat Grooming'),
    (r'\b(eyelash|bulu\s*mata|lem\s*bulu\s*mata)\b', ['Synthetic Fiber / Latex-free Adhesive'], False, 'Alat Kecantikan'),
]

def main():
    json_path = os.path.join(os.path.dirname(__file__), "products.json")
    with open(json_path, "r", encoding="utf-8") as f:
        products = json.load(f)

    print(f"Total produk awal: {len(products)}")
    initial_with_ing = sum(1 for p in products if p.get('beauty_advisor', {}).get('key_ingredients'))
    print(f"Produk awal dengan ingredients: {initial_with_ing}/{len(products)}")

    for p in products:
        ba = p.setdefault('beauty_advisor', {})
        existing_ings = []
        title = p.get('nama_produk', '')
        lower_title = title.lower()
        combined_text = f"{title} {p.get('brand', '')}".lower()

        # 0. Cek exact override untuk produk spesifik (softlens, kutek, kapas, acnes)
        matched_override = False
        for pat, ov_ings, is_skin, subcat in EXACT_ITEM_OVERRIDES:
            if re.search(pat, lower_title):
                existing_ings = list(ov_ings)
                ba['is_skincare'] = is_skin
                p['sub_category'] = subcat
                matched_override = True
                break

        if not matched_override:
            # 1. Cek pola nama seri brand ternama
            for pattern, series_ings in SERIES_BRAND_DEFAULTS:
                if re.search(pattern, combined_text):
                    for ing in series_ings:
                        if ing not in existing_ings:
                            existing_ings.append(ing)

        # 2. Cek pola spesifik nama bahan dalam judul produk
        for pattern, ing_name in SPECIFIC_PATTERNS:
            if re.search(pattern, lower_title):
                if ing_name not in existing_ings:
                    existing_ings.append(ing_name)

        # 3. Jika masih kosong, gunakan default berdasarkan Kategori / Subkategori
        if not existing_ings:
            cat_key = f"{p.get('category')}/{p.get('sub_category')}"
            if cat_key in CATEGORY_DEFAULTS:
                existing_ings.extend(CATEGORY_DEFAULTS[cat_key])
            elif p.get('category') == 'Skincare':
                existing_ings.extend(['Niacinamide', 'Hyaluronic Acid', 'Vitamin E'])
            elif p.get('category') == 'Body Care':
                existing_ings.extend(['Glutathione', 'Niacinamide', 'Vitamin E'])
            elif p.get('category') == 'Makeup':
                existing_ings.extend(['Vitamin E', 'Titanium Dioxide'])
            else:
                existing_ings.extend(['Bahan Aktif Teruji Klinis'])

        # Simpan ingredients yang diperkaya (maksimal 5 bahan utama teratas)
        ba['key_ingredients'] = existing_ings[:5]

        # 4. Perbarui search_document
        p['search_document'] = rebuild_search_document(p)

    final_with_ing = sum(1 for p in products if p.get('beauty_advisor', {}).get('key_ingredients'))
    print(f"Produk akhir dengan ingredients: {final_with_ing}/{len(products)} ({final_with_ing/len(products)*100:.1f}%)")

    # Simpan kembali ke products.json
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(products, f, ensure_ascii=False, indent=2)

    print("✅ Berhasil memperbarui backend/products.json!")

if __name__ == "__main__":
    main()
