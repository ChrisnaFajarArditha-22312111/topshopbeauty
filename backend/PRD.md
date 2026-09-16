# 🛍️ Topshop Kosmetik AI

## Rancang Bangun Website E-Commerce Topshop Kosmetik untuk Konsultasi Produk Kosmetik Berbasis Kecerdasan Buatan

**Studi Kasus: Topshop Kosmetik Bandar Lampung**

---

## 📌 Deskripsi

Topshop Kosmetik AI adalah website **e-commerce kosmetik dan skincare** yang dilengkapi dengan fitur **AI Beauty Advisor** untuk membantu pengguna menemukan produk kosmetik berdasarkan kebutuhan, kondisi kulit, jenis kulit, masalah kulit, budget, serta informasi produk yang tersedia di database.

Sistem menggabungkan:

* E-Commerce
* AI Beauty Advisor
* Product Recommendation
* Retrieval-Augmented Generation (RAG)
* PostgreSQL
* pgvector
* Qwen
* FastAPI
* LangChain
* Mayar Payment Gateway
* Biteship Shipping API
* Docker
* Alibaba Cloud ECS

AI tidak digunakan sebagai database produk. Informasi produk tetap berasal dari database dan knowledge base sehingga rekomendasi dapat dikontrol dan diverifikasi.

---

# 🎯 Tujuan Sistem

Sistem ini bertujuan untuk:

1. Membuat platform e-commerce untuk produk kosmetik dan skincare.
2. Memudahkan pengguna mencari dan membeli produk.
3. Memberikan konsultasi produk melalui AI Beauty Advisor.
4. Memberikan rekomendasi berdasarkan data produk yang tersedia.
5. Membantu pengguna menemukan produk sesuai jenis dan masalah kulit.
6. Menyediakan informasi kandungan, penggunaan, harga, stok, dan detail produk.
7. Menyediakan sistem pembayaran online.
8. Menyediakan integrasi pengiriman dan tracking.
9. Menyediakan dashboard administrasi untuk pengelolaan toko.
10. Mengurangi risiko rekomendasi AI yang tidak sesuai dengan data produk.

---

# ✨ Fitur Utama

## 👤 Authentication & Account

Sistem authentication menggunakan email/password dan Google OAuth.

### Register

Pengguna dapat membuat akun menggunakan:

* Nama
* Email
* Password
* Konfirmasi password

Setelah registrasi, pengguna **belum dapat menggunakan akun sepenuhnya sebelum melakukan verifikasi email**.

Flow:

```text
Register
   ↓
Input Email + Password
   ↓
Simpan User
   ↓
Generate Verification Code
   ↓
Kirim Kode ke Email
   ↓
User Input Kode
   ↓
Verifikasi Berhasil
   ↓
Account Activated
   ↓
Login
```

### Email Verification

Verifikasi email menggunakan kode OTP.

Contoh:

```text
Kode verifikasi Anda:

482913

Kode berlaku selama 10 menit.
```

Ketentuan yang direkomendasikan:

* OTP 6 digit
* Masa berlaku 10 menit
* OTP hanya dapat digunakan satu kali
* Maksimal percobaan verifikasi
* Tombol kirim ulang kode
* Cooldown resend OTP
* OTP disimpan dalam bentuk hash
* Jangan menyimpan OTP plaintext di database

---

## 🔐 Login Email

Pengguna dapat login menggunakan:

```text
Email
Password
```

Flow:

```text
Email + Password
       ↓
Validasi User
       ↓
Password Verification
       ↓
Email Verified?
   ┌───┴────┐
  Tidak    Ya
   ↓        ↓
Verifikasi  Login
Email       ↓
            JWT
```

Jika email belum diverifikasi:

```text
Email belum diverifikasi.
Silakan verifikasi email terlebih dahulu.
```

Sistem dapat menyediakan tombol:

```text
Kirim ulang kode verifikasi
```

---

# 🔵 Login dengan Google

Pengguna juga dapat melakukan login menggunakan Google.

Flow:

```text
Login dengan Google
        ↓
Google OAuth
        ↓
Google memberikan ID Token
        ↓
Backend melakukan validasi token
        ↓
Cari email pengguna
        ↓
User ditemukan?
    ┌────┴─────┐
   Ya         Tidak
    ↓           ↓
 Login      Buat Account
                ↓
        Verifikasi Email
                ↓
             Login
                ↓
              JWT
```

### Google Login dan Email Verification

Untuk menjaga keamanan akun, sistem tetap memiliki status:

```text
email_verified
```

Pengguna Google yang baru pertama kali masuk dapat diminta melakukan verifikasi email menggunakan kode yang dikirim ke email yang terdaftar.

Setelah berhasil:

```text
email_verified = true
```

Login berikutnya dapat dilakukan secara normal menggunakan Google.

---

# 🔑 Forgot Password

Pengguna yang lupa password dapat menggunakan fitur:

```text
Lupa Password?
```

Flow:

```text
Forgot Password
       ↓
Input Email
       ↓
Generate OTP
       ↓
Kirim OTP ke Email
       ↓
Input OTP
       ↓
OTP Valid?
       ↓
Buat Password Baru
       ↓
Konfirmasi Password
       ↓
Password Updated
       ↓
Login
```

Contoh:

```text
Email
[ user@example.com ]

[ Kirim Kode ]
```

Kemudian:

```text
Kode Verifikasi
[ 123456 ]

[ Verifikasi ]
```

Kemudian:

```text
Password Baru
[ ******** ]

Konfirmasi Password
[ ******** ]

[ Reset Password ]
```

### Security

Password baru harus:

* Di-hash menggunakan Argon2 atau bcrypt.
* Tidak disimpan plaintext.
* Tidak dikirim melalui email.
* Token reset memiliki masa berlaku.
* Reset token hanya dapat digunakan satu kali.

---

# 👨‍💻 User Profile

Setiap pengguna memiliki profile sendiri.

Profile dipisahkan dari tabel authentication agar struktur database lebih rapi.

Informasi profile:

```text
Profile
├── Foto Profile
├── Nama Lengkap
├── Email
├── Nomor Telepon
├── Tanggal Lahir (opsional)
├── Jenis Kelamin (opsional)
├── Bio (opsional)
└── Preferensi
```

Pengguna dapat:

* Melihat profile
* Mengubah nama
* Mengubah nomor telepon
* Mengubah foto profile
* Mengubah informasi profile
* Mengelola alamat
* Melihat pesanan
* Melihat wishlist
* Mengubah password
* Logout

Email digunakan sebagai identitas login dan sebaiknya tidak dapat diubah secara bebas tanpa proses verifikasi email baru.

---

# 🏠 User Address

Pengguna dapat menyimpan beberapa alamat.

Contoh:

```text
Alamat Rumah
Jl. Contoh No. 10
Bandar Lampung
Lampung
35100

[Alamat Utama]
```

Fitur:

* Tambah alamat
* Edit alamat
* Hapus alamat
* Set alamat utama
* Beberapa alamat pengiriman

Struktur:

```text
User
 └── Addresses
      ├── Rumah
      ├── Kantor
      └── Lainnya
```

---

# ⚙️ Account Settings

Pengguna memiliki halaman pengaturan akun.

Fitur:

```text
Pengaturan
├── Profile
├── Email
├── Nomor Telepon
├── Ubah Password
├── Alamat
├── Notifikasi
├── Wishlist
├── Riwayat Pesanan
├── Privacy
└── Logout
```

---

# 🛒 E-Commerce

## Product

Pengguna dapat:

* Melihat produk
* Mencari produk
* Filter produk
* Sorting
* Melihat kategori
* Melihat brand
* Melihat produk terbaru
* Melihat produk terlaris
* Melihat produk promo
* Melihat stok
* Melihat detail produk

---

# 🔎 Product Search

Pencarian dapat dilakukan berdasarkan:

* Nama produk
* Brand
* Kategori
* Subkategori
* Kandungan
* Jenis kulit
* Masalah kulit

Contoh:

```text
Garnier micellar water
```

---

# 🧴 Product Detail

Informasi produk:

```text
Nama Produk
Brand
Harga
Harga Asli
Diskon
Stok
Rating
Terjual
Foto
Kategori
Subkategori
Jenis Kulit
Masalah Kulit
Kandungan
Tekstur
Waktu Penggunaan
Deskripsi
```

Contoh data produk:

```json
{
  "item_id": 3116462607,
  "shop_id": 140789817,
  "nama_produk": "Garnier Micellar Water Pembersih Make Up The Series",
  "brand": "Garnier",
  "harga": 33900,
  "stok": 1,
  "terjual": 10000,
  "rating": 4.85,
  "category": "Skincare",
  "sub_category": "Makeup Remover & Cleanser",
  "beauty_advisor": {
    "is_skincare": true,
    "skin_types": [
      "All Skin Types",
      "Normal"
    ],
    "skin_concerns": [
      "Daily Maintenance",
      "Hydration"
    ],
    "key_ingredients": [],
    "usage_time": "Pagi & Malam",
    "texture": "Liquid / Water"
  }
}
```

> Data `skin_types` dan `skin_concerns` pada contoh di atas merupakan data untuk produk tersebut, bukan daftar keseluruhan jenis kulit dan masalah kulit pada sistem.

---

# 🧬 Master Data Beauty Advisor

Sistem memiliki master data yang dapat dikembangkan sesuai dataset produk.

## Skin Types

Contoh:

```text
All Skin Types
Normal
Dry
Oily
Combination
Sensitive
```

Daftar tersebut dapat diperluas berdasarkan data produk yang digunakan.

## Skin Concerns

Contoh:

```text
Acne
Blackheads
Whiteheads
Dark Spots
Hyperpigmentation
Dullness
Dehydration
Fine Lines
Wrinkles
Redness
Irritation
Uneven Skin Tone
Enlarged Pores
Daily Maintenance
```

Data tersebut juga dapat diperluas berdasarkan dataset.

---

# 🤖 AI Beauty Advisor

AI Beauty Advisor merupakan fitur utama sistem.

Pengguna dapat melakukan konsultasi menggunakan bahasa natural.

Contoh:

```text
Kulit saya berminyak dan sering jerawatan.
Ada produk di bawah 50 ribu?
```

Sistem kemudian:

```text
User
 ↓
Input Guard
 ↓
Query Analyzer
 ↓
Product Filtering
 ↓
RAG / pgvector
 ↓
Recommendation Engine
 ↓
Qwen
 ↓
Output Guard
 ↓
Recommendation
```

---

# 🧠 AI Recommendation Architecture

AI tidak diberikan seluruh database produk setiap kali pengguna bertanya.

Arsitektur:

```text
                 ┌─────────────────┐
                 │      User       │
                 └────────┬────────┘
                          ↓
                 ┌─────────────────┐
                 │   Input Guard   │
                 └────────┬────────┘
                          ↓
                 ┌─────────────────┐
                 │ Query Analyzer  │
                 └────────┬────────┘
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
     PostgreSQL Filter          pgvector RAG
              │                       │
              └───────────┬───────────┘
                          ↓
              ┌─────────────────────┐
              │ Recommendation      │
              │ Engine              │
              └──────────┬──────────┘
                         ↓
                  Candidate Products
                         ↓
              ┌─────────────────────┐
              │       Qwen          │
              └──────────┬──────────┘
                         ↓
                ┌─────────────────┐
                │  Output Guard   │
                └────────┬────────┘
                         ↓
                     Response
```

---

# 🛡️ AI Guardrails

AI dibatasi agar tetap berada pada domain kosmetik dan skincare.

## Input Guard

Mengecek apakah pertanyaan masih relevan.

Contoh:

```text
User:
Buatkan kode Python untuk saya.

AI:
Maaf, saya hanya dapat membantu konsultasi
produk kosmetik dan skincare.
```

---

## System Prompt

Qwen diberikan instruksi yang ketat.

Prinsip:

```text
Gunakan hanya informasi produk yang diberikan oleh sistem.

Jangan mengarang kandungan produk.

Jangan mengarang manfaat produk.

Jangan mengarang harga.

Jangan merekomendasikan produk yang tidak tersedia.

Jika informasi tidak tersedia,
katakan bahwa informasi tidak tersedia.
```

---

# 🔍 RAG + pgvector

Produk memiliki `search_document` yang digunakan untuk semantic search.

Contoh:

```text
Garnier Micellar Water Pembersih Make Up The Series.
Brand: Garnier.
Kategori: Skincare.
Cocok untuk jenis kulit: All Skin Types, Normal.
Membantu mengatasi: Daily Maintenance, Hydration.
Harga: Rp 33.900.
Rating: 4.85.
```

Flow:

```text
Pertanyaan User
       ↓
Embedding
       ↓
pgvector
       ↓
Relevant Products
       ↓
Recommendation Engine
       ↓
Qwen
       ↓
Jawaban
```

---

# 🎯 Recommendation Engine

Recommendation Engine bertugas memilih kandidat produk sebelum diberikan kepada Qwen.

Contoh:

```text
User:
Produk skincare untuk kulit normal
di bawah Rp40.000
```

Backend mengambil:

```text
skin_type = Normal
category = Skincare
max_price = 40000
```

Kemudian database melakukan filtering.

Qwen hanya menerima produk yang sudah dipilih oleh sistem.

Dengan demikian Qwen berfungsi terutama untuk:

* Memahami konteks
* Menjelaskan produk
* Membandingkan produk
* Menyusun jawaban
* Memberikan alasan berdasarkan data

Bukan sebagai database produk.

---

# 🧴 Product Database Design

Data produk tidak disimpan sebagai satu JSON besar.

Database menggunakan struktur relational.

```text
products
├── id
├── item_id
├── shop_id
├── nama_produk
├── brand_id
├── harga
├── harga_min
├── harga_max
├── harga_asli
├── diskon_persen
├── stok
├── terjual
├── rating
├── foto_utama
├── url_produk
├── category_id
├── sub_category_id
├── usage_time
├── texture
├── is_skincare
├── search_document
├── embedding
├── created_at
└── updated_at
```

---

# 🧬 Product Relations

```text
Product
 ├── Brand
 ├── Category
 ├── Sub Category
 ├── Product Images
 ├── Product Ingredients
 ├── Product Skin Types
 └── Product Skin Concerns
```

Karena satu produk dapat cocok untuk beberapa jenis kulit dan masalah kulit, relasinya menggunakan many-to-many.

```text
Product
    │
    ├── Product Skin Types
    │       ├── Normal
    │       └── Sensitive
    │
    └── Product Skin Concerns
            ├── Hydration
            └── Daily Maintenance
```

---

# 🛍️ Shopping Cart

Fitur:

* Add to cart
* Update quantity
* Remove product
* Cart total
* Stock validation
* Wishlist
* Move wishlist to cart

---

# ❤️ Wishlist

Pengguna dapat menyimpan produk favorit.

```text
User
 └── Wishlist
       ├── Product A
       ├── Product B
       └── Product C
```

---

# 💳 Checkout

Flow checkout:

```text
Cart
 ↓
Select Address
 ↓
Select Courier
 ↓
Calculate Shipping
 ↓
Voucher
 ↓
Order Summary
 ↓
Payment
 ↓
Order Created
```

---

# 💰 Payment

Payment gateway menggunakan **Mayar**.

Flow:

```text
Checkout
   ↓
Create Order
   ↓
Create Payment
   ↓
Mayar
   ↓
User Payment
   ↓
Payment Callback / Webhook
   ↓
Verify Payment
   ↓
Order = Paid
```

Status pembayaran:

```text
Pending
Paid
Failed
Expired
Cancelled
```

Webhook payment wajib divalidasi di backend.

---

# 🚚 Shipping

Shipping menggunakan **Biteship**.

Fitur:

* Pilih courier
* Hitung ongkos kirim
* Estimasi pengiriman
* Generate shipment
* Tracking number
* Tracking status

Flow:

```text
Order Paid
    ↓
Create Shipment
    ↓
Biteship
    ↓
Courier
    ↓
Tracking Number
    ↓
Order Shipped
```

---

# 📦 Order

Status order:

```text
Menunggu Pembayaran
        ↓
Dibayar
        ↓
Diproses
        ↓
Dikirim
        ↓
Selesai
```

Fitur pengguna:

* Melihat detail pesanan
* Melihat status pesanan
* Melihat invoice
* Melihat tracking
* Membatalkan pesanan berdasarkan kondisi
* Memberikan rating
* Memberikan review

---

# ⭐ Review

Pengguna dapat memberikan:

* Rating
* Review
* Foto produk (opsional)

Review hanya dapat dilakukan terhadap produk yang benar-benar pernah dibeli.

---

# 👨‍💼 Admin Dashboard

Admin memiliki dashboard khusus.

## Dashboard

Menampilkan:

* Total penjualan
* Total order
* Total customer
* Pendapatan
* Produk terlaris
* Order terbaru
* Grafik penjualan
* Produk stok rendah

---

# 📦 Product Management

Admin dapat:

* Create product
* Update product
* Delete product
* Upload foto
* Update harga
* Update stok
* Update berat
* Update kategori
* Update brand
* Update ingredients
* Update jenis kulit
* Update skin concerns
* Update deskripsi

---

# 📋 Order Management

Admin dapat:

* Melihat order
* Melihat detail order
* Memverifikasi pembayaran
* Memproses order
* Input tracking
* Mengubah status order
* Mengelola pembatalan
* Mengelola refund sesuai kebijakan

---

# 👥 Customer Management

Admin dapat:

* Melihat daftar customer
* Melihat profile customer
* Melihat riwayat transaksi
* Melihat status akun
* Mengelola status akun

Admin tidak boleh melihat password pengguna karena password disimpan dalam bentuk hash.

---

# 🏷️ Category & Brand Management

Admin dapat mengelola:

```text
Category
Sub Category
Brand
Skin Type
Skin Concern
Ingredients
```

---

# 🎁 Promotion Management

Fitur:

* Voucher
* Discount
* Promo Product
* Banner
* Promo period
* Minimum purchase
* Maximum discount

---

# 🗄️ Database Architecture

Database menggunakan:

```text
PostgreSQL
+
pgvector
```

## Authentication & User

```text
users
profiles
user_addresses
user_sessions
email_verifications
password_reset_tokens
oauth_accounts
```

### `users`

Menyimpan informasi authentication utama:

```text
id
email
password_hash
email_verified
is_active
created_at
updated_at
```

### `profiles`

Menyimpan data profile:

```text
id
user_id
full_name
phone
avatar_url
date_of_birth
gender
bio
created_at
updated_at
```

### `user_addresses`

```text
id
user_id
label
recipient_name
phone
address
province
city
district
postal_code
is_default
created_at
updated_at
```

### `oauth_accounts`

Digunakan untuk login Google.

```text
id
user_id
provider
provider_account_id
created_at
```

Contoh:

```text
provider = google
```

### `email_verifications`

```text
id
user_id
email
code_hash
expires_at
verified_at
attempt_count
created_at
```

### `password_reset_tokens`

```text
id
user_id
token_hash
expires_at
used_at
created_at
```

---

# 🗃️ E-Commerce Database

```text
products
brands
categories
sub_categories
product_images
ingredients
product_ingredients
skin_types
skin_concerns
product_skin_types
product_skin_concerns

cart
cart_items

wishlist

orders
order_items

payments
shipments

promotions
vouchers

reviews
```

---

# 🤖 AI Database

```text
ai_conversations
ai_messages
product_embeddings
```

Atau embedding dapat disimpan langsung di tabel `products` menggunakan PostgreSQL + pgvector.

Contoh:

```text
search_document
embedding vector(...)
```

---

# 🔐 Authentication Security

Sistem authentication menggunakan beberapa lapisan keamanan.

### Password

Password:

* Tidak disimpan plaintext.
* Menggunakan Argon2 atau bcrypt.
* Memiliki password validation.

### JWT

Setelah login berhasil:

```text
Email + Password
       ↓
Authentication
       ↓
JWT Access Token
       ↓
Protected API
```

### Email OTP

OTP:

* 6 digit
* Expired
* One-time use
* Rate limited
* Disimpan sebagai hash

### Google OAuth

Backend wajib melakukan validasi token dari Google sebelum membuat session.

### Rate Limiting

Rate limiting diterapkan pada endpoint sensitif:

```text
/login
/register
/verify-email
/resend-verification
/forgot-password
/reset-password
```

---

# 🧩 AI Provider Architecture

Sistem menggunakan abstraction agar provider AI dapat diganti.

```text
AIProvider
    ├── AlibabaQwenProvider
    └── LocalQwenProvider
```

Environment:

```env
AI_PROVIDER=alibaba
```

atau:

```env
AI_PROVIDER=local
```

Dengan arsitektur tersebut, backend tidak bergantung langsung pada satu provider.

---

# 🧠 AI Model

## Primary

**Alibaba Cloud Qwen API**

Digunakan untuk deployment awal karena inference dilakukan melalui API sehingga server ECS tidak perlu menyediakan GPU khusus untuk menjalankan model.

## Alternative

**Qwen 3B Local**

Digunakan untuk:

* Eksperimen
* Benchmark
* Perbandingan
* Pengembangan offline
* Evaluasi resource

Parameter evaluasi:

```text
Accuracy
Recommendation Quality
Relevance
Hallucination
Instruction Following
Response Time
Resource Usage
Cost
Deployment Complexity
```

---

# ☁️ Cloud Architecture

Deployment menggunakan Alibaba Cloud ECS.

```text
                   Internet
                      │
                      ↓
                 Cloudflare
                      │
                      ↓
              Alibaba Cloud ECS
                      │
             ┌────────┴────────┐
             ↓                 ↓
         Frontend           Backend
         Container          FastAPI
                               │
                    ┌──────────┴──────────┐
                    ↓                     ↓
               PostgreSQL              pgvector
                    │
                    │
                    ↓
             Product Database

Backend
   │
   ├── Alibaba Qwen API
   ├── Mayar API
   └── Biteship API
```

---

# 🐳 Docker Architecture

Container utama:

```text
docker-compose
│
├── frontend
├── backend
└── postgres
```

PostgreSQL menggunakan extension:

```text
pgvector
```

Redis bersifat optional dan dapat ditambahkan untuk:

* Caching
* Rate limiting
* Session
* Background job
* Queue

Qwen Alibaba Cloud **tidak perlu dijalankan sebagai container** karena digunakan melalui API.

---

# 📁 Project Structure

```text
topshop-kosmetik/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   └── email.py
│   │   │
│   │   ├── auth/
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   ├── models.py
│   │   │   ├── otp_service.py
│   │   │   ├── password_reset.py
│   │   │   └── google_oauth.py
│   │   │
│   │   ├── users/
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── schemas.py
│   │   │   └── models.py
│   │   │
│   │   ├── profiles/
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   │
│   │   ├── addresses/
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   │
│   │   ├── products/
│   │   ├── categories/
│   │   ├── brands/
│   │   ├── ingredients/
│   │   ├── skin_types/
│   │   ├── skin_concerns/
│   │   │
│   │   ├── cart/
│   │   ├── wishlist/
│   │   ├── checkout/
│   │   ├── payments/
│   │   ├── shipping/
│   │   ├── orders/
│   │   ├── promotions/
│   │   ├── reviews/
│   │   │
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
│   │   │
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── products/
│   │       ├── orders/
│   │       ├── customers/
│   │       └── promotions/
│   │
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .dockerignore
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── profile/
│   │   │   ├── products/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   └── beauty-advisor/
│   │   └── services/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── .dockerignore
│
├── docker/
│   └── postgres/
│       └── init.sql
│
├── .env
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

# ⚙️ Environment Configuration

`.env.example`

```env
APP_NAME=Topshop Kosmetik AI
APP_ENV=development
APP_PORT=8000

POSTGRES_USER=topshop
POSTGRES_PASSWORD=change_this_password
POSTGRES_DB=topshop_db

DATABASE_URL=postgresql://topshop:change_this_password@postgres:5432/topshop_db

JWT_SECRET_KEY=change_this_secret
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

AI_PROVIDER=alibaba

ALIBABA_CLOUD_API_KEY=your_api_key
ALIBABA_CLOUD_REGION=your_region
QWEN_MODEL=your_qwen_model

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_EMAIL=your_email

MAYAR_API_KEY=your_mayar_api_key

BITESHIP_API_KEY=your_biteship_api_key
```

---

# 🚀 Installation

Clone repository:

```bash
git clone <repository-url>
```

Masuk ke directory:

```bash
cd topshop-kosmetik
```

Copy environment:

```bash
cp .env.example .env
```

Build Docker:

```bash
docker compose build
```

Jalankan:

```bash
docker compose up -d
```

Cek container:

```bash
docker compose ps
```

---

# 📜 Docker Commands

Melihat log:

```bash
docker compose logs -f
```

Backend:

```bash
docker compose logs -f backend
```

PostgreSQL:

```bash
docker compose logs -f postgres
```

Rebuild:

```bash
docker compose up -d --build
```

Stop:

```bash
docker compose down
```

Stop dan hapus volume:

```bash
docker compose down -v
```

> `docker compose down -v` akan menghapus volume database sehingga data PostgreSQL dapat ikut terhapus.

---

# 🔄 Authentication API Flow

Endpoint yang direkomendasikan:

```text
POST /api/v1/auth/register
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification

POST /api/v1/auth/login

GET  /api/v1/auth/google
POST /api/v1/auth/google/callback

POST /api/v1/auth/forgot-password
POST /api/v1/auth/verify-reset-code
POST /api/v1/auth/reset-password

POST /api/v1/auth/logout
POST /api/v1/auth/refresh
```

---

# 👤 Profile API

```text
GET    /api/v1/profile
PATCH  /api/v1/profile

POST   /api/v1/profile/avatar
DELETE /api/v1/profile/avatar
```

---

# 🏠 Address API

```text
GET    /api/v1/addresses
POST   /api/v1/addresses
GET    /api/v1/addresses/{id}
PATCH  /api/v1/addresses/{id}
DELETE /api/v1/addresses/{id}

PATCH /api/v1/addresses/{id}/default
```

---

# 🛍️ Product API

```text
GET /api/v1/products
GET /api/v1/products/{id}
GET /api/v1/products/search
GET /api/v1/categories
GET /api/v1/brands
```

---

# 🤖 Beauty Advisor API

```text
POST /api/v1/beauty-advisor/chat
GET  /api/v1/beauty-advisor/conversations
GET  /api/v1/beauty-advisor/conversations/{id}
```

Contoh:

```json
{
  "message": "Saya punya kulit normal dan mencari skincare di bawah 50 ribu"
}
```

Backend:

```text
Input
 ↓
Guard
 ↓
Intent Analysis
 ↓
Structured Filter
 ↓
Vector Search
 ↓
Recommendation Engine
 ↓
Qwen
 ↓
Output Guard
```

---

# 🔒 Security

Security yang diterapkan:

* Password hashing
* JWT authentication
* Google OAuth token validation
* Email verification
* OTP expiration
* Password reset token expiration
* Rate limiting
* Input validation
* API authorization
* Admin role authorization
* Environment variables
* HTTPS
* Payment webhook validation
* Shipping webhook validation
* AI input guard
* AI output guard
* SQL injection protection
* CORS configuration

---

# 📈 Scalability

Target awal:

```text
±50 concurrent users
```

Arsitektur awal:

```text
Frontend
   ↓
FastAPI
   ↓
PostgreSQL + pgvector
   ↓
Alibaba Qwen API
```

Jika trafik meningkat:

```text
Load Balancer
       ↓
┌──────┼──────┐
↓      ↓      ↓
API  API     API
       ↓
     Redis
       ↓
PostgreSQL
       ↓
Workers / Queue
```

Pengembangan selanjutnya dapat menggunakan:

* Redis
* Background workers
* Queue
* Multiple FastAPI instances
* Database indexing
* Query optimization
* Caching
* CDN
* Object storage
* Load balancing

---

# 🧪 AI Model Evaluation

Sistem dapat melakukan perbandingan:

```text
Alibaba Cloud Qwen API
        VS
Qwen 3B Local
```

Parameter:

| Parameter              | Penilaian                        |
| ---------------------- | -------------------------------- |
| Relevance              | Apakah jawaban sesuai pertanyaan |
| Recommendation Quality | Kualitas rekomendasi             |
| Accuracy               | Ketepatan informasi              |
| Hallucination          | Apakah AI mengarang informasi    |
| Instruction Following  | Kepatuhan terhadap prompt        |
| Response Time          | Kecepatan response               |
| Resource Usage         | Penggunaan CPU/RAM/GPU           |
| Cost                   | Biaya penggunaan                 |
| Deployment             | Kemudahan deployment             |

---

# 📊 Recommended AI Strategy

Untuk tahap awal:

```text
Alibaba Cloud Qwen API
        +
FastAPI
        +
PostgreSQL
        +
pgvector
        +
Recommendation Engine
```

Qwen 3B Local dapat digunakan sebagai model pembanding.

Dengan abstraction:

```text
AIProvider
    │
    ├── AlibabaQwenProvider
    │
    └── LocalQwenProvider
```

Pemilihan provider dapat dilakukan melalui:

```env
AI_PROVIDER=alibaba
```

atau:

```env
AI_PROVIDER=local
```

---

# 🧱 Recommended User Architecture

Struktur user dibuat terpisah:

```text
                    User
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
    Authentication            Profile
          │                     │
     ┌────┼────┐          ┌─────┼─────┐
     ↓    ↓    ↓          ↓     ↓     ↓
 Email Google Session    Avatar Phone Address
     │
     ↓
 Email Verification
     │
     ↓
 Password Reset
```

Sedangkan aktivitas pengguna:

```text
User
 │
 ├── Profile
 ├── Addresses
 ├── Cart
 ├── Wishlist
 ├── Orders
 ├── Reviews
 └── AI Conversations
```

Struktur ini membuat sistem lebih mudah dikembangkan dibandingkan memasukkan seluruh data pengguna ke satu tabel.

---

# 🗺️ User Journey

## New User

```text
Landing Page
     ↓
Register
     ↓
Email Verification
     ↓
Profile Setup
     ↓
Browse Product
     ↓
AI Consultation
     ↓
Product Recommendation
     ↓
Add to Cart
     ↓
Checkout
     ↓
Payment
     ↓
Shipping
     ↓
Order Completed
     ↓
Review
```

## Existing User

```text
Login
 ↓
Home
 ↓
Product / AI Advisor
 ↓
Cart
 ↓
Checkout
 ↓
Payment
 ↓
Order
```

## Forgot Password

```text
Login
 ↓
Forgot Password
 ↓
Input Email
 ↓
Email OTP
 ↓
Verify OTP
 ↓
New Password
 ↓
Password Updated
 ↓
Login
```

---

# 🏗️ Development Priority

Pengembangan disarankan dilakukan bertahap.

## Phase 1 — Foundation

```text
Project Setup
Docker
PostgreSQL
FastAPI
Frontend
Environment
```

## Phase 2 — Authentication

```text
Register
Email Verification
Login Email
Google Login
Forgot Password
Reset Password
Logout
Profile
Address
```

## Phase 3 — Product

```text
Product
Category
Brand
Skin Type
Skin Concern
Ingredients
Search
Filter
Product Detail
```

## Phase 4 — E-Commerce

```text
Cart
Wishlist
Checkout
Order
Payment
Shipping
```

## Phase 5 — AI

```text
Qwen
LangChain
Embedding
pgvector
RAG
Recommendation Engine
Input Guard
Output Guard
```

## Phase 6 — Admin

```text
Dashboard
Product Management
Order Management
Customer Management
Promotion
Category
Brand
```

## Phase 7 — Deployment

```text
Docker
Alibaba Cloud ECS
Cloudflare
HTTPS
Monitoring
Backup
```

---

# 📌 Project Technology

| Component          | Technology                  |
| ------------------ | --------------------------- |
| Backend            | FastAPI                     |
| Language           | Python                      |
| Frontend           | Web                         |
| Database           | PostgreSQL                  |
| Vector Database    | pgvector                    |
| AI                 | Qwen                        |
| AI Platform        | Alibaba Cloud Model Studio  |
| AI Framework       | LangChain                   |
| AI Architecture    | RAG + Recommendation Engine |
| Authentication     | JWT + Google OAuth          |
| Email Verification | Email OTP                   |
| Payment            | Mayar                       |
| Shipping           | Biteship                    |
| Container          | Docker                      |
| Orchestration      | Docker Compose              |
| Cloud              | Alibaba Cloud ECS           |
| CDN / DNS          | Cloudflare                  |

---

# 🔮 Future Development

Fitur yang dapat dikembangkan:

* AI skin analysis
* AI beauty profile
* Personalized recommendation
* Product comparison
* AI routine skincare
* Product bundles
* Personalized promotion
* Loyalty point
* Membership
* Notification
* WhatsApp notification
* Advanced analytics
* AI sales assistant untuk admin
* Recommendation berdasarkan riwayat pembelian
* Recommendation berdasarkan wishlist
* Recommendation berdasarkan preferensi pengguna

---

# 📄 Project Information

**Project:**

> Rancang Bangun Website E-Commerce Topshop Kosmetik untuk Konsultasi Produk Kosmetik Berbasis Kecerdasan Buatan

**Case Study:**

> Topshop Kosmetik Bandar Lampung

**Backend:**

> FastAPI / Python

**Frontend:**

> Web Application

**Database:**

> PostgreSQL + pgvector

**AI:**

> Qwen + Alibaba Cloud Model Studio + LangChain + RAG + Recommendation Engine

**Authentication:**

> Email/Password + Email Verification + Google OAuth

**Payment:**

> Mayar

**Shipping:**

> Biteship

**Containerization:**

> Docker + Docker Compose

**Cloud:**

> Alibaba Cloud ECS

**AI Provider:**

> Alibaba Cloud Qwen API / Qwen 3B Local

---

# 👨‍💻 Developer

Developed as a software engineering and AI-based e-commerce project for:

**Topshop Kosmetik Bandar Lampung**
