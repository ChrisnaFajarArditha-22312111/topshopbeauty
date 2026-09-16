# 🛍️ Topshop Kosmetik AI — Project Rules

## 📌 Project Overview

**Nama Project:** Rancang Bangun Website E-Commerce Topshop Kosmetik untuk Konsultasi Produk Kosmetik Berbasis Kecerdasan Buatan  
**Studi Kasus:** Topshop Kosmetik Bandar Lampung  
**PRD:** Lihat `PRD.md` untuk detail lengkap.

---

## 🔧 Tech Stack (JANGAN DIGANTI tanpa konfirmasi)

| Layer | Teknologi |
|---|---|
| Backend | **FastAPI** (Python) |
| Database | **PostgreSQL** + **pgvector** |
| AI Model | **Qwen** via Alibaba Cloud Model Studio |
| AI Framework | **LangChain** |
| AI Architecture | **RAG** + Recommendation Engine |
| Authentication | **JWT** + **Google OAuth** |
| Email Verification | OTP 6 digit via SMTP |
| Payment | **Mayar** |
| Shipping | **Biteship** |
| Container | **Docker** + Docker Compose |
| Cloud | **Alibaba Cloud ECS** |
| CDN / DNS | **Cloudflare** |

---

## 📁 Struktur Project

```
topshop-kosmetik/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   └── email.py
│   │   ├── auth/
│   │   ├── users/
│   │   ├── profiles/
│   │   ├── addresses/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── brands/
│   │   ├── ingredients/
│   │   ├── skin_types/
│   │   ├── skin_concerns/
│   │   ├── cart/
│   │   ├── wishlist/
│   │   ├── checkout/
│   │   ├── payments/
│   │   ├── shipping/
│   │   ├── orders/
│   │   ├── promotions/
│   │   ├── reviews/
│   │   ├── beauty_advisor/
│   │   │   ├── chat/
│   │   │   ├── guardrails/
│   │   │   ├── recommendation/
│   │   │   ├── rag/
│   │   │   ├── prompts/
│   │   │   └── llm/
│   │   │       ├── base.py
│   │   │       ├── alibaba_qwen.py
│   │   │       └── local_qwen.py
│   │   └── admin/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
│
├── frontend/
├── docker/
│   └── postgres/
│       └── init.sql
├── .env
├── .env.example
├── docker-compose.yml
└── README.md
```

---

## 🗄️ Database Tables

### Auth & User
- `users` — email, password_hash, email_verified, is_active
- `profiles` — full_name, phone, avatar_url, date_of_birth, gender, bio
- `user_addresses` — label, recipient_name, phone, address, province, city, district, postal_code, is_default
- `user_sessions`
- `email_verifications` — code_hash, expires_at, attempt_count
- `password_reset_tokens` — token_hash, expires_at, used_at
- `oauth_accounts` — provider (google), provider_account_id

### E-Commerce
- `products` — item_id, shop_id, nama_produk, brand_id, harga, harga_asli, diskon_persen, stok, terjual, rating, category_id, sub_category_id, usage_time, texture, is_skincare, **search_document**, **embedding**
- `brands`, `categories`, `sub_categories`
- `product_images`, `ingredients`, `product_ingredients`
- `skin_types`, `skin_concerns`, `product_skin_types`, `product_skin_concerns`
- `cart`, `cart_items`, `wishlist`
- `orders`, `order_items`
- `payments`, `shipments`
- `promotions`, `vouchers`
- `reviews`

### AI
- `ai_conversations`, `ai_messages`
- Embedding disimpan langsung di tabel `products` menggunakan pgvector

---

## 🔐 Aturan Security (WAJIB DIIKUTI)

- Password: hash menggunakan **Argon2** atau **bcrypt**, TIDAK BOLEH plaintext
- OTP: 6 digit, expire 10 menit, one-time use, disimpan sebagai **hash**
- JWT: access token + refresh token
- Google OAuth: backend WAJIB validasi token dari Google
- Rate limiting WAJIB di endpoint: `/login`, `/register`, `/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password`
- Payment webhook WAJIB divalidasi di backend
- AI input guard dan output guard WAJIB diterapkan

---

## 🤖 AI Architecture (JANGAN DIUBAH)

```
User
 ↓
Input Guard
 ↓
Query Analyzer
 ↓
PostgreSQL Filter + pgvector RAG
 ↓
Recommendation Engine
 ↓
Qwen
 ↓
Output Guard
 ↓
Response
```

**Prinsip utama:**
- AI TIDAK diberikan seluruh database produk setiap request
- AI hanya menerima kandidat produk yang sudah difilter sistem
- AI TIDAK boleh mengarang harga, kandungan, atau manfaat produk
- Jika informasi tidak tersedia, katakan tidak tersedia

**AI Provider abstraction:**
```python
AIProvider
    ├── AlibabaQwenProvider   # default (AI_PROVIDER=alibaba)
    └── LocalQwenProvider     # untuk eksperimen (AI_PROVIDER=local)
```

---

## 🌐 API Endpoints Convention

Semua endpoint menggunakan prefix `/api/v1/`.

Contoh:
- `POST /api/v1/auth/register`
- `GET /api/v1/products`
- `POST /api/v1/beauty-advisor/chat`

---

## 🏗️ Development Phase (Status)

| Phase | Scope | Status |
|---|---|---|
| 1 | Foundation (Docker, PostgreSQL, FastAPI) | ✅ Selesai |
| 2 | Authentication & Profile | ✅ Selesai |
| 3 | Product Management | ✅ Selesai |
| 4 | E-Commerce (Cart, Order, Payment, Shipping) | ✅ Selesai |
| 5 | AI Beauty Advisor | ✅ Selesai |
| 6 | Admin Dashboard | ✅ Selesai |
| 7 | Deployment (Alibaba Cloud ECS) | ✅ Selesai |

> Update status ini saat phase selesai: ⬜ Belum | 🔄 In Progress | ✅ Selesai


---

## 📋 Konvensi Kode

- Bahasa komentar & docstring: **Indonesia**
- Bahasa variabel & fungsi: **English** (snake_case)
- Setiap modul mengikuti struktur: `router.py`, `service.py`, `schemas.py`, `models.py`
- Gunakan **Pydantic v2** untuk schemas
- Gunakan **SQLAlchemy** untuk ORM
- Gunakan **Alembic** untuk database migration

---

## ⚠️ Hal yang TIDAK BOLEH Dilakukan

- Jangan ganti payment gateway dari Mayar ke provider lain tanpa konfirmasi
- Jangan ganti shipping dari Biteship ke provider lain tanpa konfirmasi
- Jangan ganti AI model dari Qwen ke model lain tanpa konfirmasi
- Jangan hapus abstraction layer AIProvider
- Jangan simpan password atau OTP dalam bentuk plaintext
- Jangan expose environment variable ke response API

---

## 📋 Instruksi untuk AI Agent (WAJIB DIIKUTI)

### Saat Memulai Sesi
1. **Baca `CHANGELOG.md`** — pahami progress terakhir, phase apa yang sudah selesai, file apa yang sudah ada.
2. **Jangan mengerjakan ulang** hal yang sudah selesai kecuali diminta.
3. **Lanjutkan dari titik terakhir** sesuai yang tercatat di `CHANGELOG.md`.

### Saat Menyelesaikan Pekerjaan
Setelah setiap task selesai, **wajib update `CHANGELOG.md`**:

1. **Centang checklist** item yang sudah selesai (`- [ ]` → `- [x]`)
2. **Tambahkan nama file** ke bagian "File yang Sudah Dibuat"
3. **Tambahkan endpoint** ke bagian "Endpoint yang Sudah Selesai" (jika ada)
4. **Update status phase** jika phase sudah selesai (`⬜ Belum` → `🔄 In Progress` → `✅ Selesai`)
5. **Tambahkan baris baru** di tabel "Log Perubahan" dengan format:
   ```
   | YYYY-MM-DD | Phase X | Deskripsi singkat apa yang dikerjakan | Agent/Model |
   ```
6. **Update "Last Updated"** di bagian atas CHANGELOG.md

### Contoh Update Log
```markdown
| 2026-09-12 | Phase 1 | Membuat docker-compose.yml, Dockerfile, main.py | Claude Sonnet |
```

> ⚠️ Jangan skip update CHANGELOG.md. File ini adalah satu-satunya sumber kebenaran progress project.
