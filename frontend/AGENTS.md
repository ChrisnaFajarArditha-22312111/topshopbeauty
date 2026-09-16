# 💄 Topshop Kosmetik AI — Frontend Rules & Guidelines

## 📌 Project Overview

**Nama Project:** Frontend Website E-Commerce Topshop Kosmetik (User / Customer Application)  
**Tujuan:** Platform e-commerce kosmetik & skincare berbasis Next.js dengan fitur konsultasi AI Beauty Advisor.  
**Backend API:** FastAPI (`http://localhost:8000/api/v1` atau `NEXT_PUBLIC_API_BASE_URL`)  
**Dokumentasi API:** Lihat `docs/API_CONTRACT.md` dan `docs/openapi.json` di root project.

---

## 🔧 Tech Stack (WAJIB DIIKUTI)

| Layer | Teknologi |
|---|---|
| Framework | **Next.js 15+ / 16 (App Router)** |
| Language | **TypeScript** |
| Styling | **Tailwind CSS v4** |
| UI Component Library | **shadcn/ui** (Radix UI primitives + Lucide Icons) |
| Server State / Data Fetching | **TanStack Query (React Query v5)** |
| HTTP Client | **Axios** (Centralized instance + Interceptors) |
| Form & Validation | **React Hook Form** + **Zod** |
| Icons | **Lucide React** |
| Date Utility | **date-fns** |

---

## 📁 Struktur Folder Project

Gunakan konvensi arsitektur berbasis fitur (Feature-based / Layered) di dalam `app/` atau `src/`:

```
frontend/
├── app/                              # Next.js App Router (Halaman & Routing)
│   ├── (auth)/                       # Route group untuk Auth
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-email/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (shop)/                       # Route group untuk E-Commerce umum
│   │   ├── page.tsx                  # Landing Page / Homepage
│   │   ├── products/
│   │   │   ├── page.tsx              # Katalog produk + filter & search
│   │   │   └── [id]/page.tsx         # Detail produk & ulasan
│   │   ├── cart/page.tsx             # Keranjang belanja
│   │   ├── wishlist/page.tsx         # Daftar produk favorit
│   │   └── checkout/page.tsx         # Proses checkout pesanan
│   ├── (account)/                    # Route group untuk Akun Pengguna (Protected)
│   │   ├── profile/page.tsx          # Pengaturan profil user
│   │   ├── addresses/page.tsx        # Manajemen alamat pengiriman
│   │   └── orders/
│   │       ├── page.tsx              # Riwayat pesanan
│   │       └── [id]/page.tsx         # Detail order, status, tracking Biteship
│   ├── beauty-advisor/               # Fitur AI Beauty Advisor
│   │   └── page.tsx                  # Chat UI interaktif dengan rekomendasi produk
│   ├── layout.tsx                    # Root layout (Navbar, Providers, Footer)
│   └── globals.css                   # Tailwind styles
│
├── components/                       # Reusable Components
│   ├── ui/                           # shadcn/ui components (button, dialog, input, card, toast, etc.)
│   ├── layout/                       # Navbar, Footer, MobileNav, UserMenu, CartDrawer
│   ├── product/                      # ProductCard, ProductGrid, PriceBadge, StarRating
│   ├── chat/                         # ChatWidget, MessageBubble, ProductRecommendationCard
│   └── shared/                       # EmptyState, LoadingSpinner, ErrorBoundary, Pagination
│
├── features/                         # Logika spesifik domain (Hooks, API calls, Types)
│   ├── auth/                         # useAuth, authApi, authTypes
│   ├── products/                     # useProducts, useProductDetail, productApi
│   ├── cart/                         # useCart, cartApi
│   ├── checkout/                     # useCheckout, checkoutApi
│   ├── orders/                       # useOrders, orderApi
│   └── beauty-advisor/               # useBeautyChat, chatApi
│
├── lib/
│   ├── axios.ts                      # Axios instance, request/response interceptors (JWT, Refresh, Error)
│   ├── query-client.ts               # Konfigurasi TanStack QueryClient
│   ├── utils.ts                      # cn() helper, formatRupiah(), formatDate()
│   └── constants.ts                  # App constants, API endpoints, LocalStorage keys
│
├── hooks/                            # Global custom hooks (useToast, useMediaQuery, useDebounce, etc.)
├── types/                            # Global TypeScript definitions
├── AGENTS.md                         # Rules untuk AI agent (file ini)
├── CHANGELOG.md                      # Progress tracker frontend
└── PRD.md                            # Frontend requirements & user journey
```

---

## 🔐 Konvensi API Client & Auth (Axios + TanStack Query)

1. **Axios Client Centralized (`lib/axios.ts`)**:
   - Gunakan `NEXT_PUBLIC_API_BASE_URL` (default: `http://localhost:8000/api/v1`).
   - Request Interceptor: Otomatis menyisipkan `Authorization: Bearer <access_token>` dari state/storage jika ada.
   - Response Interceptor: Menangani HTTP 401 (Unauthorized) untuk otomatis trigger `/api/v1/auth/refresh` menggunakan `refresh_token`, atau redirect ke login jika refresh gagal.
   - Idempotency Header: Untuk request POST sensitif (misal `/checkout`), sertakan header `Idempotency-Key` (UUIDv4).

2. **TanStack Query Conventions**:
   - Manfaatkan Query Keys yang terstruktur (contoh: `['products', { category, search, page }]`, `['cart']`, `['order', orderId]`).
   - Gunakan optimistic updates untuk Cart dan Wishlist untuk pengalaman pengguna yang responsif.
   - Kelola error secara konsisten (tampilkan pesan toast/alert dari response backend `detail`).

---

## 🎨 UI/UX Design System (Airbnb Style + 9 Golden Rules)

- **Gaya Desain:** Terinspirasi dari kesederhanaan, kelegaan, dan estetika **Airbnb**:
  - **Floating Search Capsule:** Kapsul pencarian mengambang dengan 3 segmen (Nama/Brand, Tipe Kulit, Masalah/Budget) dan tombol kaca pembesar bulat Plum.
  - **Category Carousel:** Baris horizontal kategori produk scrollable dengan icon minimalis Lucide.
  - **Clean Product Cards:** Foto `1:1`, icon Wishlist hati di sudut kanan atas foto, dan tag kecocokan kulit halus.
- **Kepatuhan Wajib Terhadap 9 Golden Rules of UI/UX:**
  1. *Strive for Consistency:* Konsistensi warna (Navy, Plum, Warm Cream), radius (`rounded-2xl` kartu, `rounded-full` tombol), dan istilah Bahasa Indonesia.
  2. *Enable Shortcuts:* Shortcut `/` untuk fokus pencarian, tombol *"Beli Sekarang"* instan, dan tombol *"Beli Lagi"*.
  3. *Offer Informative Feedback:* Loading state pada tombol, notifikasi Toast (Sonner) setiap aksi berhasil, dan animasi badge counter.
  4. *Yield Closure:* Titik awal, proses, dan konfirmasi penyelesaian jelas (misal: checkout berakhir di halaman sukses invoice).
  5. *Simple Error Handling:* Validasi form live dengan Zod, pesan error ramah, dan tombol *"Coba Lagi"* saat gagal.
  6. *Easy Reversal of Actions:* Opsi *"Undo"* pada toast hapus keranjang, dan dialog konfirmasi sebelum aksi destruktif.
  7. *Internal Locus of Control:* Pengguna bebas mengubah kuantitas, memilih kurir Biteship, atau menutup modal kapan saja.
  8. *Reduce Memory Load:* Order summary sidebar selalu terlihat, indikator kecocokan kulit tertera di kartu produk, dan riwayat chat AI tersimpan.
  9. *Aesthetic & Minimalist:* Whitespace lega, hindari elemen bertumpuk/clutter, kontras warna tegas dan elegan.
- **Komponen:** Gunakan shadcn/ui components (`npx shadcn@latest add ...`). Jangan buat manual elemen seperti dropdown/modal/dialog/popover jika shadcn menyediakannya.
- **Responsivitas:** Wajib **Mobile-First Responsive** (nyaman diakses via smartphone karena mayoritas pengguna e-commerce berbelanja via mobile).
- **State Handling:** Setiap halaman/komponen wajib memiliki 3 state:
  1. **Loading State** (Skeleton loader / Spinner shadcn).
  2. **Empty State** (Ilustrasi / pesan informatif saat tidak ada data).
  3. **Error State** (Pesan error ramah pengguna dengan opsi "Coba Lagi").

---

## 🤖 AI Beauty Advisor Integration Rules

- Halaman / Widget Chat konsultasi kecantikan harus menampilkan:
  - Welcome banner & saran pertanyaan pembuka (quick prompts).
  - Tampilan chat bubble yang ramah dan interaktif.
  - Kartu produk rekomendasi tersemat langsung di dalam chat (menampilkan foto, nama, brand, harga, kecocokan kulit, dan tombol "Tambah ke Keranjang" atau "Beli Sekarang").
  - Disclaimer medis otomatis yang jelas sesuai PRD.
  - Riwayat sesi konsultasi pengguna yang tersimpan di backend.

---

## 📋 Aturan Kerja AI Agent (WAJIB DIIKUTI)

1. **Baca `CHANGELOG.md`** sebelum memulai pekerjaan untuk mengetahui progress terakhir.
2. **Pastikan Typesafety**: Jangan gunakan `any`. Definisikan interface/type TypeScript sesuai schema respon FastAPI di `docs/API_CONTRACT.md`.
3. **Update `CHANGELOG.md`** setiap kali menyelesaikan tugas/halaman:
   - Centang checklist (`[ ]` → `[x]`).
   - Tambahkan nama file yang dibuat/dimodifikasi.
   - Tuliskan ringkasan di tabel "Log Perubahan".
   - Update tanggal dan author pada "Last Updated".
