# 🛠️ Helper Scripts — Topshop Kosmetik AI

Folder ini berisi kumpulan skrip bash praktis untuk mengelola, menjalankan, dan menguji backend Topshop Kosmetik AI secara otomatis.

---

## 📋 Daftar Skrip

| Skrip | Deskripsi | Perintah |
|---|---|---|
| **`start.sh`** | Menyalakan PostgreSQL (pgvector) & Backend FastAPI di Docker, sinkronisasi `.env`, cek port, dan tunggu healthcheck. | `./scripts/start.sh` |
| **`stop.sh`** | Mematikan seluruh container Docker dengan aman. | `./scripts/stop.sh` |
| **`restart.sh`** | Merestart service backend FastAPI. | `./scripts/restart.sh` |
| **`logs.sh`** | Melihat live output log backend secara real-time (`tail -f`). | `./scripts/logs.sh` |
| **`seed.sh`** | Mengisi database dengan data awal: akun Admin, Customer verified, dan 30 katalog produk dari `products.json`. | `./scripts/seed.sh` |
| **`test_endpoints.sh`** | Menjalankan test otomatis ke seluruh 100 endpoint API (Auth, Produk, Keranjang, Checkout, AI Advisor, Admin, dll). | `./scripts/test_endpoints.sh` |
| **`test_biteship.sh`** | Menguji koneksi langsung ke Biteship API menggunakan key aktif (cek kurir, cari Area ID, hitung tarif). | `./scripts/test_biteship.sh` |

---

## 🚀 Panduan Singkat Memulai

```bash
# 1. Jalankan backend & database
./scripts/start.sh

# 2. Lihat log backend (opsional)
./scripts/logs.sh

# 3. Uji seluruh endpoint API
./scripts/test_endpoints.sh

# 4. Hentikan server saat selesai
./scripts/stop.sh
```

---

## 🌐 URL Penting Setelah Server Aktif
- **Swagger UI Interactive Docs:** [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **ReDoc Documentation:** [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

## 🔑 Akun Bawaan (Default Dev Data)
- **Admin:** `admin@topshopbeauty.cloud` / `Admin123!`
- **Customer:** `customer@topshopbeauty.cloud` / `Customer123!`
