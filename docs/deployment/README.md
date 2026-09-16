# 🌐 Arsitektur & Panduan Deployment — Topshop Kosmetik AI

Repositori ini mendukung strategi deployment **Hybrid Cloud (Terpisah)** untuk performa, skalabilitas, dan efisiensi biaya yang optimal:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           PENGGUNA / BROWSER                           │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
         (Akses Web Customer)                 (Panggilan API / Data)
                    │                                 │
                    ▼                                 ▼
       ┌─────────────────────────┐       ┌─────────────────────────┐
       │     VERCEL PLATFORM     │       │       VPS INSTANCE      │
       │   (Edge Global CDN)     │       │   (Ubuntu 22.04/24.04)  │
       │                         │       │                         │
       │  Next.js 16 (App Router)│       │  Nginx Reverse Proxy    │
       │  React 19 + Turbopack   │       │  FastAPI (4 Workers)    │
       │  SSR, ISR, Static Cache │       │  PostgreSQL 15+pgvector │
       │                         │       │  AI Qwen + Biteship +   │
       │  Domain:                │       │  Mayar Payment          │
       │  topshopbeauty.cloud    │       │                         │
       │                         │       │  Subdomain:             │
       │                         │       │  api.topshopbeauty.cloud│
       └─────────────────────────┘       └─────────────────────────┘
```

---

## 📑 Daftar Dokumen Panduan

Dokumentasi deployment telah disusun secara modular untuk mempermudah eksekusi:

| Dokumen | Deskripsi | Target Platform |
|---|---|---|
| [**`BACKEND_VPS.md`**](./BACKEND_VPS.md) | Panduan langkah demi langkah deployment backend FastAPI, PostgreSQL + pgvector, Nginx, SSL, dan Docker Compose | VPS (Alibaba Cloud ECS / DigitalOcean / Linode / IDCloudHost / Hetzner) |
| [**`FRONTEND_VERCEL.md`**](./FRONTEND_VERCEL.md) | Panduan deployment frontend Next.js 16 ke platform Vercel, setup Environment Variables, Custom Domain, dan optimasi build | Vercel Platform |
| [**`INTEGRASI_DNS_CORS.md`**](./INTEGRASI_DNS_CORS.md) | Konfigurasi keterhubungan antara Frontend Vercel dan Backend VPS: DNS Records, CORS whitelist, webhook payment & ekspedisi | Cloudflare / DNS Registrar / FastAPI |
| [**`MONOREPO.md`**](./MONOREPO.md) | Penjelasan struktur Monorepo & konfigurasi Ignored Build Step Vercel agar perubahan BE tidak memicu build FE | Konfigurasi Git & Vercel |

---

## 🎯 Keuntungan Arsitektur Hybrid (Vercel + VPS)

1. **Performa Frontend Maksimal:** Frontend Next.js di-deploy pada jaringan Vercel Edge CDN global dengan waktu respon kilat (< 50ms di Indonesia via Node Singapura/Jakarta), optimasi gambar otomatis, dan Zero-Config SSL.
2. **Kestabilan Backend & Database:** Backend FastAPI, database PostgreSQL dengan ekstensi `pgvector` (untuk fitur AI Beauty Advisor), dan background processing berjalan independen di VPS tanpa batasan *serverless execution timeout*.
3. **Isolasi Biaya & Sumber Daya:** Lonjakan pengunjung web tidak membebani komputasi database, dan sebaliknya beban komputasi AI vektor tidak memperlambat respon halaman customer.
4. **Keamanan & Skalabilitas:** Komunikasi aman melalui protokol HTTPS/TLS dengan whitelist CORS ketat dan proteksi rate limiting di layer Nginx/Cloudflare.
