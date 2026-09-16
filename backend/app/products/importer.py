"""
importer.py — Skrip import data produk dari products.json ke PostgreSQL
- Melakukan normalisasi data Brand, Kategori, Subkategori
- Relasi Many-to-Many: Skin Types, Skin Concerns, Ingredients
- Menyimpan galeri foto ke tabel product_images
- Menyimpan search_document untuk semantic/text search
"""
import json
import os
import uuid
from typing import Dict, Any, List
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.products.models import (
    Product,
    Brand,
    Category,
    SubCategory,
    SkinType,
    SkinConcern,
    Ingredient,
    ProductImage,
)

def slugify(text: str) -> str:
    """Helper membuat slug URL-friendly."""
    return "-".join(text.lower().replace("/", "-").replace("&", "dan").split())

async def import_products_from_json(db: AsyncSession, json_path: str, limit: int = None) -> int:
    """Import dataset json ke database PostgreSQL."""
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"File tidak ditemukan: {json_path}")

    with open(json_path, "r", encoding="utf-8") as f:
        data: List[Dict[str, Any]] = json.load(f)

    if limit:
        data = data[:limit]

    # Cache master data lokal agar efisien query
    brands_cache: Dict[str, Brand] = {}
    categories_cache: Dict[str, Category] = {}
    subcategories_cache: Dict[str, SubCategory] = {}
    skin_types_cache: Dict[str, SkinType] = {}
    skin_concerns_cache: Dict[str, SkinConcern] = {}
    ingredients_cache: Dict[str, Ingredient] = {}

    # Preload existing master data
    b_res = await db.execute(select(Brand))
    for b in b_res.scalars().all():
        brands_cache[b.name.lower()] = b

    c_res = await db.execute(select(Category))
    for c in c_res.scalars().all():
        categories_cache[c.name.lower()] = c

    sc_res = await db.execute(select(SubCategory))
    for sc in sc_res.scalars().all():
        subcategories_cache[sc.name.lower()] = sc

    st_res = await db.execute(select(SkinType))
    for st in st_res.scalars().all():
        skin_types_cache[st.name.lower()] = st

    scon_res = await db.execute(select(SkinConcern))
    for scon in scon_res.scalars().all():
        skin_concerns_cache[scon.name.lower()] = scon

    ing_res = await db.execute(select(Ingredient))
    for ing in ing_res.scalars().all():
        ingredients_cache[ing.name.lower()] = ing

    imported_count = 0

    for item in data:
        item_id = item.get("item_id")
        existing_product = None
        if item_id:
            res_p = await db.execute(
                select(Product)
                .options(
                    selectinload(Product.skin_types),
                    selectinload(Product.skin_concerns),
                    selectinload(Product.ingredients),
                )
                .where(Product.item_id == item_id)
            )
            existing_product = res_p.scalar_one_or_none()

        # 1. Brand
        brand_name = (item.get("brand") or "Generic").strip()
        brand_key = brand_name.lower()
        if brand_key not in brands_cache:
            brand_obj = Brand(name=brand_name, slug=slugify(brand_name))
            db.add(brand_obj)
            await db.flush()
            brands_cache[brand_key] = brand_obj
        brand_id = brands_cache[brand_key].id

        # 2. Category
        category_name = (item.get("category") or "Uncategorized").strip()
        cat_key = category_name.lower()
        if cat_key not in categories_cache:
            cat_obj = Category(name=category_name, slug=slugify(category_name))
            db.add(cat_obj)
            await db.flush()
            categories_cache[cat_key] = cat_obj
        cat_id = categories_cache[cat_key].id

        # 3. Sub Category
        sub_cat_id = None
        sub_cat_name = (item.get("sub_category") or "").strip()
        if sub_cat_name:
            sub_key = sub_cat_name.lower()
            if sub_key not in subcategories_cache:
                sub_obj = SubCategory(category_id=cat_id, name=sub_cat_name, slug=slugify(sub_cat_name))
                db.add(sub_obj)
                await db.flush()
                subcategories_cache[sub_key] = sub_obj
            sub_cat_id = subcategories_cache[sub_key].id

        # 4. Beauty Advisor details
        ba = item.get("beauty_advisor", {})
        is_skincare = ba.get("is_skincare", True)
        usage_time = ba.get("usage_time")
        texture = ba.get("texture")

        # 5. Siapkan relasi Many-to-Many sebelum flush/add
        prod_skin_types = []
        for st_name in ba.get("skin_types", []):
            st_clean = st_name.strip()
            if not st_clean:
                continue
            st_key = st_clean.lower()
            if st_key not in skin_types_cache:
                st_obj = SkinType(name=st_clean)
                db.add(st_obj)
                await db.flush()
                skin_types_cache[st_key] = st_obj
            prod_skin_types.append(skin_types_cache[st_key])

        prod_skin_concerns = []
        for sc_name in ba.get("skin_concerns", []):
            sc_clean = sc_name.strip()
            if not sc_clean:
                continue
            sc_key = sc_clean.lower()
            if sc_key not in skin_concerns_cache:
                sc_obj = SkinConcern(name=sc_clean)
                db.add(sc_obj)
                await db.flush()
                skin_concerns_cache[sc_key] = sc_obj
            prod_skin_concerns.append(skin_concerns_cache[sc_key])

        prod_ingredients = []
        for ing_name in ba.get("key_ingredients", []):
            ing_clean = ing_name.strip()
            if not ing_clean:
                continue
            ing_key = ing_clean.lower()
            if ing_key not in ingredients_cache:
                ing_obj = Ingredient(name=ing_clean)
                db.add(ing_obj)
                await db.flush()
                ingredients_cache[ing_key] = ing_obj
            prod_ingredients.append(ingredients_cache[ing_key])

        # 6. Buat atau perbarui objek Product
        if existing_product:
            existing_product.brand_id = brand_id
            existing_product.category_id = cat_id
            existing_product.sub_category_id = sub_cat_id
            existing_product.is_skincare = is_skincare
            existing_product.usage_time = usage_time
            existing_product.texture = texture
            existing_product.search_document = item.get("search_document")
            existing_product.skin_types = prod_skin_types
            existing_product.skin_concerns = prod_skin_concerns
            existing_product.ingredients = prod_ingredients
            imported_count += 1
            continue

        product = Product(
            item_id=item_id,
            shop_id=item.get("shop_id"),
            nama_produk=item.get("nama_produk", "Produk Kosmetik"),
            brand_id=brand_id,
            category_id=cat_id,
            sub_category_id=sub_cat_id,
            harga=item.get("harga", 0),
            harga_min=item.get("harga_min"),
            harga_max=item.get("harga_max"),
            harga_asli=item.get("harga_asli"),
            diskon_persen=item.get("diskon_persen"),
            stok=item.get("stok", 10),
            terjual=item.get("terjual", 0),
            rating=item.get("rating", 5.0),
            foto_utama=item.get("foto_utama"),
            url_produk=item.get("url_produk"),
            is_skincare=is_skincare,
            usage_time=usage_time,
            texture=texture,
            search_document=item.get("search_document"),
            skin_types=prod_skin_types,
            skin_concerns=prod_skin_concerns,
            ingredients=prod_ingredients,
        )
        db.add(product)
        await db.flush()

        # 7. Galeri foto
        fotos = item.get("foto_galeri", [])
        for idx, f_url in enumerate(fotos):
            db.add(ProductImage(product_id=product.id, image_url=f_url, sort_order=idx))

        imported_count += 1
        if imported_count % 100 == 0:
            await db.commit()
            print(f"  ... {imported_count}/{len(data)} produk diproses")

    await db.commit()
    return imported_count
