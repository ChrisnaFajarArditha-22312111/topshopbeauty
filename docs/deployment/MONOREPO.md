# 📦 Panduan Monorepo: Isolasi Build Frontend & Backend

Dokumen ini menjelaskan struktur **Monorepo** pada proyek **Topshop Kosmetik AI** serta cara mengonfigurasi agar **perubahan pada Backend tidak memicu build ulang Frontend di Vercel, dan sebaliknya**.

---

## 🏗️ 1. Struktur Folder Monorepo

Proyek ini menggunakan arsitektur monorepo satu repositori Git terpadu:

```text
22_Topshop_Ecommerce/             <── ROOT REPOSITORI GIT
├── backend/                      <── Service Backend (FastAPI, Python, Uvicorn)
├── frontend/                     <── Service Frontend (Next.js 16, React 19)
├── deploy/                       <── Konfigurasi Nginx, Monitoring, & Skrip Backup
├── docker/                       <── Setup Database PostgreSQL + pgvector
├── docs/                         <── Dokumentasi Arsitektur, Kontrak API, & Guide
├── docker-compose.yml            <── Orkestrasi Lokal
├── docker-compose.prod.yml       <── Orkestrasi Production VPS
└── .gitignore                    <── Proteksi File Sensitif (.env, node_modules)
```

---

## ⚡ 2. Cara Kerja Isolasi di Vercel (Frontend)

Jika Anda melakukan push commit yang **hanya mengubah file di `backend/` atau `docs/`**, Anda tentu tidak ingin Vercel membuang waktu dan kuota *build minutes* untuk me-rebuild frontend yang tidak berubah.

### Cara 1: Mengatur Root Directory (Otomatis)
1. Buka dashboard Vercel -> Masuk ke Project Anda.
2. Buka tab **Settings** -> **General**.
3. Pada bagian **Root Directory**, pilih folder **`frontend`**.
4. Secara default, Vercel hanya akan men-trigger build jika terdapat perubahan file di dalam direktori `frontend/`.

---

### Cara 2: Menggunakan "Ignored Build Step" (Sangat Direkomendasikan)
Untuk memastikan 100% Vercel tidak pernah melakukan build jika tidak ada perubahan di frontend:

1. Buka dashboard Vercel -> Masuk ke tab **Settings** -> **Git**.
2. Gulir ke bawah ke bagian **Ignored Build Step**.
3. Pilih opsi **"Custom"** / Masukkan script perintah berikut pada kolom input:
   ```bash
   git diff --quiet HEAD^ HEAD -- ./
   ```
   *(Artinya: Jika tidak ada perubahan di folder `frontend/` antara commit sekarang dengan commit sebelumnya, Vercel akan mengembalikan exit code 0 dan membatalkan/skip proses build secara otomatis).*

4. Klik tombol **Save**.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Commit di GitHub: "fix(backend): optimasi query database produk"       │
│                                                                         │
│   git diff mengecek folder frontend/ -> Tidak ada perubahan            │
│                                                                         │
│   ➔ Vercel: [SKIPPED] Build dibatalkan otomatis (Hemat Kuota Build)     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ 3. Cara Kerja Isolasi di VPS (Backend)

Di sisi server VPS, backend diisolasi secara total menggunakan Docker:

1. **Context Terisolasi:** File `docker-compose.prod.yml` mendefinisikan context build secara spesifik hanya ke folder backend:
   ```yaml
   backend:
     build:
       context: ./backend
       dockerfile: Dockerfile
   ```
2. **Eksekusi Update Independen:**
   Jika Anda melakukan pembaruan kode backend di VPS, Anda hanya perlu me-rebuild container backend tanpa menyentuh database atau frontend:
   ```bash
   cd /opt/topshop-kosmetik
   git pull origin main
   docker compose -f docker-compose.prod.yml up -d --build backend
   ```
   *(Frontend di Vercel tetap berjalan di CDN global tanpa gangguan ataupun downtime).*

---

## 🛠️ 4. Menata Git Root Monorepo (Jika Belum Diinisialisasi di Root)

Jika sebelumnya folder `.git` sempat berada di dalam folder `frontend/` bawaan instalasi awal Next.js, satukan menjadi satu Git root di folder utama:

```bash
# 1. Hapus folder .git di dalam frontend (jika ada)
rm -rf frontend/.git

# 2. Inisialisasi Git di root repositori utama
git init -b main

# 3. Tambahkan seluruh folder ke Git staging
git add .

# 4. Commit pertama monorepo
git commit -m "chore: initial monorepo commit (frontend, backend, docs, deploy)"

# 5. Hubungkan ke repositori GitHub remote Anda
git remote add origin https://github.com/<username>/<repo-topshop>.git
git push -u origin main
```
