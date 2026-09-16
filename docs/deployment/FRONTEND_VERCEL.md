# ⚡ Panduan Deployment Frontend di Vercel (Next.js 16)

Panduan deployment antarmuka pengguna (**Frontend**) Topshop Kosmetik AI ke platform cloud **Vercel**.

Frontend dibangun menggunakan **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, dan **Turbopack**, sehingga sangat optimal ketika dijalankan di atas infrastruktur Vercel Edge Network.

---

## 📋 1. Prasyarat Deployment

Sebelum memulai proses deployment di Vercel, pastikan Anda telah menyiapkan:
1. **Akun Vercel:** Daftar atau login di [vercel.com](https://vercel.com).
2. **Repositori GitHub / GitLab / Bitbucket:** Kode sumber proyek sudah di-push ke branch utama (`main` atau `master`).
3. **Domain Publik:** Domain yang akan digunakan (misal: `topshopbeauty.cloud`).
4. **URL Backend VPS yang Sudah Aktif:** Backend di VPS harus sudah memiliki domain HTTPS yang berfungsi (misal: `https://api.topshopbeauty.cloud/api/v1`).

---

## 🚀 2. Langkah Demi Langkah Import Project ke Vercel

### Langkah 1: Buat New Project di Vercel Dashboard
1. Buka dashboard Vercel Anda di [vercel.com/dashboard](https://vercel.com/dashboard).
2. Klik tombol **"Add New..."** di sudut kanan atas lalu pilih **"Project"**.
3. Di bagian **"Import Git Repository"**, pilih provider Git Anda (GitHub) dan cari repositori `topshop-kosmetik`.
4. Klik tombol **"Import"** pada repositori tersebut.

---

### Langkah 2: Konfigurasi Project Settings (Root Directory Wajib)

Karena repositori ini merupakan monorepo/multi-folder (`frontend` dan `backend` dalam 1 repositori), Anda **WAJIB** menentukan Root Directory:

1. **Project Name:** Beri nama proyek, misalnya `topshop-kosmetik-frontend`.
2. **Framework Preset:** Pilih **Next.js** (biasanya terdeteksi otomatis).
3. **Root Directory:**
   - Klik tombol **"Edit"** di sebelah Root Directory.
   - Pilih folder **`frontend`**.
   - Klik **"Continue"**.
4. **Build and Output Settings:**
   - **Build Command:** Biarkan default (`npm run build` atau `next build`).
   - **Output Directory:** Biarkan default (`.next`).
   - **Install Command:** Biarkan default (`npm install`).

```text
┌─────────────────────────────────────────────────────────┐
│ Root Directory:        frontend                         │
│ Framework Preset:      Next.js                          │
│ Build Command:         npm run build                    │
│ Node.js Version:       20.x (atau 22.x)                 │
└─────────────────────────────────────────────────────────┘
```

---

### Langkah 3: Konfigurasi Environment Variables

Buka panel **"Environment Variables"** pada halaman konfigurasi Vercel dan tambahkan variabel berikut:

| Key | Value Contoh (Production) | Lingkungan (Environment) |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.topshopbeauty.cloud/api/v1` | Production, Preview, Development |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `<CLIENT_ID_GOOGLE_OAUTH>.apps.googleusercontent.com` | Production, Preview, Development |

> [!IMPORTANT]
> - Pastikan nilai `NEXT_PUBLIC_API_BASE_URL` diakhiri dengan `/api/v1` sesuai routing FastAPI backend.
> - Menggunakan protokol aman **`https://`** (bukan `http://`) untuk mencegah error *Mixed Content* di browser modern.

---

### Langkah 4: Klik Deploy!

1. Klik tombol **"Deploy"**.
2. Tunggu proses kompilasi Turbopack dan pembuatan halaman statis berlangsung (~1 hingga 2 menit).
3. Setelah selesai, Vercel akan menampilkan ucapan selamat beserta screenshot preview dan domain bawaan (contoh: `topshop-kosmetik-frontend.vercel.app`).

---

## 🌐 3. Konfigurasi Custom Domain

Untuk menggunakan domain brand resmi Anda (misalnya `topshopbeauty.cloud`):

### A. Tambahkan Domain di Vercel:
1. Masuk ke Project Anda di Vercel -> Buka tab **"Settings"** -> pilih menu **"Domains"**.
2. Masukkan nama domain Anda: `topshopbeauty.cloud`.
3. Vercel akan merekomendasikan penambahan dua entri:
   - `topshopbeauty.cloud` (Apex domain)
   - `www.topshopbeauty.cloud` (Subdomain www yang auto-redirect ke apex domain)
4. Klik **"Add"**.

### B. Konfigurasi DNS di Registrar / Cloudflare:
Masukkan DNS Record berikut pada penyedia domain Anda:

#### Opsi 1: Jika menggunakan DNS Standar (Registrar Domain):
| Type | Name | Target / Value |
|---|---|---|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

#### Opsi 2: Jika menggunakan Cloudflare DNS:
| Type | Name | Target / Value | Proxy Status |
|---|---|---|---|
| `CNAME` | `@` | `cname.vercel-dns.com` | DNS Only (Grey Cloud) / Proxied |
| `CNAME` | `www` | `cname.vercel-dns.com` | DNS Only (Grey Cloud) / Proxied |

> [!TIP]
> Vercel akan otomatis menerbitkan sertifikat SSL Let's Encrypt gratis dalam hitungan detik setelah DNS terpropagasi.

---

## 🔄 4. Alur CI/CD & Deploy Otomatis

Vercel telah terintegrasi secara otomatis dengan Git:
- **Production Deployment:** Setiap kali Anda melakukan `git push` atau merge ke branch `main`, Vercel akan otomatis men-trigger build baru dan memperbarui aplikasi secara instan tanpa downtime (*Zero-Downtime Deployment*).
- **Preview Deployment:** Jika Anda membuat Pull Request (PR) atau push ke branch non-main, Vercel akan membuat URL preview unik untuk pengujian sebelum digabung ke production.
- **Instant Rollback:** Jika terjadi bug di production, Anda dapat memutar kembali versi deployment ke commit sebelumnya hanya dengan 1 klik melalui tab **"Deployments"** -> klik menu 3 titik -> **"Promote to Production"**.

---

## 🔍 5. Troubleshooting Deployment Frontend

### 1. Error: `Network Error` atau Data Produk Tidak Muncul
- **Penyebab:** Frontend tidak dapat menghubungi backend atau terblokir CORS.
- **Solusi:**
  1. Pastikan `NEXT_PUBLIC_API_BASE_URL` di Vercel sudah benar dan menggunakan `https://`.
  2. Pastikan domain Vercel Anda (`https://topshopbeauty.cloud`) sudah didaftarkan pada variabel `ALLOWED_ORIGINS` di backend VPS.

### 2. Error: `Module not found` saat Build di Vercel
- **Penyebab:** Root Directory belum diset ke folder `frontend`.
- **Solusi:** Buka **Project Settings** -> **General** -> ubah **Root Directory** menjadi `frontend`, lalu jalankan *Redeploy*.

### 3. Mengubah Environment Variables
- Jika Anda mengubah nilai `NEXT_PUBLIC_API_BASE_URL` di Settings Vercel:
  - Perubahan **TIDAK AKAN** langsung berefek ke build yang sedang berjalan.
  - Masuk ke tab **"Deployments"** -> klik menu titik tiga pada deployment teratas -> pilih **"Redeploy"** (centang opsi *Use existing Build Cache* bila tidak ingin build ulang dari awal).
