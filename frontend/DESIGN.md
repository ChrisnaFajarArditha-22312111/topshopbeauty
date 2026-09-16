# 💄 Topshop Kosmetik — Frontend Design Specification

## 1. Project Overview & Design Philosophy

**Project:** Rancang Bangun Website E-Commerce Topshop Kosmetik untuk Konsultasi Produk Kosmetik Berbasis Kecerdasan Buatan  
**Studi Kasus:** Topshop Kosmetik Bandar Lampung  
**Inspirasi Utama:** **Airbnb-Style Simplicity & Modern Beauty E-Commerce** dipadukan dengan **9 Golden Rules of UI/UX**.

Website ini menggabungkan kesederhanaan navigasi, keterbacaan, dan kelegaan visual khas Airbnb dengan kehangatan dunia kosmetik/skincare serta kecerdasan **AI Beauty Advisor**.

---

## ⚖️ 2. The 9 Golden Rules of UI/UX (Aturan Wajib Seluruh Fitur)

Setiap halaman, komponen, modal, dan interaksi yang dibangun **WAJIB** mematuhi 9 prinsip berikut:

1. **Strive for Consistency (Konsistensi)**
   - Konsistensi tombol: Tombol utama selalu pill-shaped (`rounded-full`) dengan warna Plum (`#865071`).
   - Konsistensi kartu: Semua kartu produk dan metrik menggunakan `rounded-2xl`, border halus (`border-stone-200`), dan shadow tipis.
   - Konsistensi istilah bahasa: Menggunakan Bahasa Indonesia yang ramah, sopan, dan konsisten (*"Tambah ke Keranjang"*, *"Beli Sekarang"*, *"Mulai Konsultasi"*).

2. **Enable Frequent Users to Use Shortcuts (Fleksibilitas & Akses Cepat)**
   - Shortcut keyboard: Tekan `/` untuk langsung fokus ke Search Bar Airbnb-style.
   - Quick Buy: Tombol *"Beli Sekarang"* di kartu produk untuk bypass keranjang langsung ke checkout.
   - Re-Order: Tombol *"Beli Lagi"* pada riwayat pesanan yang sudah selesai.

3. **Offer Informative Feedback (Umpan Balik Informatif Real-Time)**
   - Tombol berubah menjadi loading spinner saat proses API berjalan.
   - Notifikasi Toast (Sonner) muncul setiap kali ada aksi (misal: *"Produk berhasil ditambahkan ke keranjang"*).
   - Counter badge keranjang dan wishlist beranimasi halus saat bertambah.

4. **Design Dialogs to Yield Closure (Penutupan Alur yang Jelas)**
   - Setiap alur memiliki titik awal, proses, dan konfirmasi penyelesaian yang tegas:
     - Checkout: `Alamat` → `Ongkir` → `Pembayaran` → **`Halaman Sukses & Invoice`**.
     - AI Konsultasi: `Pertanyaan` → `Analisis Cerdas` → **`Rekomendasi Produk Terpilih & Aksi Beli`**.
     - Review: `Bintang & Komentar` → **`Ulasan Berhasil Dipublikasikan`**.

5. **Offer Simple Error Handling (Pencegahan & Penanganan Error yang Ramah)**
   - Validasi live dengan Zod pada form sebelum submit.
   - Pesan error manusiawi dan jelas di bawah input (bukan kode error teknis).
   - Tombol *"Coba Lagi"* (*Refetch*) saat koneksi internet bermasalah.

6. **Permit Easy Reversal of Actions (Kemudahan Membatalkan Aksi / Undo)**
   - Tombol *"Batal / Undo"* muncul pada toast saat menghapus item dari keranjang atau wishlist.
   - Pengguna dapat mengubah alamat atau kurir kapan saja sebelum tombol bayar akhir ditekan.
   - Konfirmasi Dialog sebelum tindakan destruktif (seperti hapus produk di admin).

7. **Support Internal Locus of Control (Pengguna Memegang Kendali Penuh)**
   - Pengguna bebas mengubah kuantitas barang, menghapus isi keranjang, atau menutup modal kapan saja.
   - Pengguna leluasa memilih opsi kurir Biteship (JNE, SiCepat, J&T) berdasarkan kecepatan atau harga termurah.

8. **Reduce Short-Term Memory Load (Kurangi Beban Ingatan Pengguna)**
   - Order summary sidebar selalu terlihat saat checkout.
   - Metadata kecantikan (Tipe Kulit & Masalah Kulit) tersemat jelas di kartu produk tanpa harus membuka detail.
   - Riwayat percakapan konsultasi AI tersimpan rapi sehingga user tidak perlu menceritakan ulang masalah kulitnya.

9. **Aesthetic and Minimalist Design (Desain Estetik & Minimalis)**
   - Whitespace yang luas dan bersih, membuang elemen banner berkedip atau teks menumpuk.
   - Menggunakan visual beresolusi tinggi dengan proporsi seimbang ala galeri Airbnb.

---

## 🏡 3. Landing Page Ala Airbnb Version

Halaman utama (`/`) dirancang dengan inspirasi kesederhanaan Airbnb:

### A. Floating Search Capsule (Airbnb-Style Search Pill)
Diletakkan secara mengambang dan elegan di tengah atas:
- **Segmen 1 (Kebutuhan Produk):** Input teks nama produk atau brand (*"Cari skincare, serum, sunscreen..."*).
- **Segmen 2 (Tipe Kulit):** Dropdown pilihan tipe kulit (*Semua, Berminyak, Kering, Sensitif, Normal, Kombinasi*).
- **Segmen 3 (Target Masalah / Budget):** Pilihan masalah kulit (*Jerawat, Kusam, Noda Hitam*) atau batas harga.
- **Tombol Search Bulat:** Tombol icon kaca pembesar melingkar berwarna Plum yang langsung mengarahkan ke hasil filter katalog.

### B. Category Carousel Bar (Airbnb-Style Horizontal Categories)
Baris kategori horizontal scrollable dengan icon minimalis Lucide di bawah search capsule:
- `Skincare`, `Cleanser`, `Toner`, `Serum`, `Moisturizer`, `Sunscreen`, `Acne Care`, `Makeup`, `Masker`.
- Klik salah satu kategori langsung memfilter daftar produk secara instan tanpa memuat ulang halaman.

### C. Hero Banner yang Bersih & Berkelas
- Foto editorial beauty bernuansa natural, hangat, dan profesional.
- Headline kuat: *"Perawatan Tepat untuk Setiap Cerita Kulitmu"*.
- Sub-headline: *"Konsultasi personal dengan AI Beauty Advisor untuk menemukan produk kosmetik dan skincare yang benar-benar cocok untukmu."*
- CTA Utama: **"Mulai Konsultasi AI"** (Plum Button) & **"Jelajahi Produk"** (Clean Outline Button).

### D. Airbnb-Style Clean Product Grid
- Foto produk beresolusi tajam dengan rasio `1:1`.
- Icon Wishlist hati transparan di sudut kanan atas foto (klik langsung toggle favorit dengan animasi halus).
- Tag rekomendasi AI kecil di sudut kiri atas foto (misal: *"Cocok untuk Kulit Kering"*).
- Informasi: Brand (uppercase kecil), Nama Produk (semibold 2 baris), Rating bintang emas + jumlah terjual, serta Harga coret & Harga promo diskon.

### E. AI Consultation Highlight Card (Ala Airbnb Experiences)
- Kartu lebar dengan background Blush lembut (`#F4E6EB`).
- Preview percakapan konsultasi: *"Kulit saya berminyak & rentan jerawat, ada rekomendasi serum di bawah 100rb?"* → Rekomendasi 2 produk terkurasi.
- Tombol CTA: **"Coba Konsultasi Gratis Sekarang"**.

---

## 🎨 4. Identitas Brand, Spesifikasi Logo & Sistem Warna

### 4.1. Spesifikasi Logo Resmi (`logo.png`)

Asset resmi brand tersimpan pada direktori: [`frontend/public/logo.png`](file:///home/casper/Tools/22_Topshop_Ecommerce/frontend/public/logo.png) (resolusi asli 1254 × 1254 px, non-interlaced RGB).

#### A. Karakteristik & Anatomi Logo:
- **Monogram "TS":** Perpaduan kurva inisial *Top Shop* yang berkesinambungan dengan efek gradasi *smooth rose-pink* (pink muda ke rose coral).
- **Wordmark "TOPSHOPERS":** Tipografi sans-serif modern dengan penjarakan huruf lebar (*wide letter-spacing*) di bagian bawah monogram.
- **Filosofi Visual:**
  - **Keanggunan & Kehangatan (*Softness & Glow*):** Nuansa gradasi pink muda mencerminkan keindahan kulit sehat terawat, keceriaan, dan keramahan (*approachable beauty*).
  - **Modernitas & Presisi (*AI & Science*):** Lekukan geometris rapi mencerminkan akurasi teknologi AI Beauty Advisor dan kurasi formula skincare yang aman.

#### B. Aturan Implementasi Logo pada Komponen UI:
1. **Desktop Navbar (`components/layout/navbar.tsx`):**
   - Menggunakan komponen `next/image` dengan dimensi 44 × 44 px (`w-11 h-11`).
   - Dibungkus dalam wadah bulat (`rounded-full`) berlatar belakang putih dengan border tipis `border-pink-200/80` dan efek hover scale halus (`group-hover:scale-105`).
   - Diposisikan di samping teks brand *"TopshopKosmetik — Bandar Lampung • AI Beauty"*.
2. **Mobile Drawer & Sheet (`components/layout/navbar.tsx`):**
   - Ukuran 28 × 28 px (`w-7 h-7`) di samping judul menu navigasi.
3. **Footer Toko (`components/layout/footer.tsx`):**
   - Ukuran 40 × 40 px (`w-10 h-10`), wadah bulat putih kontras di atas latar belakang *Deep Navy* (`#17243D`).
4. **Favicon & Metadata Browser (`app/layout.tsx`):**
   - Didaftarkan pada object `metadata.icons` (`icon`, `shortcut`, dan `apple`) mengarah ke `/logo.png`.
5. **Halaman Autentikasi (`/login`, `/register`, `/verify-email`):**
   - Ditampilkan di bagian header kartu form auth dengan ukuran 64 × 64 px (`w-16 h-16`) sebagai *focal point* kredibilitas brand.

---

### 4.2. Sistem Warna Harmonisasi Pink Muda & Rose (*Color Tokens*)

Seluruh palet warna diselaraskan secara matematis dengan warna dominan pada logo untuk menciptakan harmoni visual (*harmony in beauty*), dipadukan dengan *Navy* untuk keterbacaan teks (*high readability*):

| Token | Hex Code | Tailwind / CSS Var | Peran Customer (Web) | Peran Admin Dashboard |
|---|---|---|---|---|
| **Primary Logo Rose** | `#D83F5E` | `primary` / `rose-500` | Tombol CTA utama, badge diskon, link aktif, search button | Tombol submit primer, highlight KPI |
| **Hover Deep Rose** | `#C83253` | `rose-600` / `plum-600` | State hover tombol utama, icon keranjang/wishlist aktif | Hover tombol aksi primer |
| **Pink Muda (Soft Blush)** | `#FDE8EB` | `secondary` / `blush-100` | Background kartu AI Consultation, chip tag, hover kategori | Alert info ringan, badge status |
| **Pink Muda Highlight** | `#FAB7B9` | `blush-200` | Border aksen kartu pilihan, ring fokus | Ring fokus interaktif |
| **Soft Rose Tint Background** | `#FFF9FA` | `background` / `cream-50` | Latar belakang seluruh halaman web (segar & bersih) | Background konten sekunder |
| **Primary Navy** | `#253654` | `navy-800` / `foreground` | Teks judul utama (H1-H4), nama produk, kontras tinggi | Teks tabel, header dashboard |
| **Deep Navy** | `#17243D` | `navy-950` | Latar belakang footer utama, banner gelap | Latar belakang sidebar admin |
| **Neutral Rose Border** | `#F2D8DC` | `border` / `input` | Garis pemisah halus, border kartu produk, input form | Garis pemisah data tabel |
| **Text Muted Warm** | `#70636B` | `muted-foreground` | Deskripsi produk, subtitle, rating count | Label form, subtitle metrik |
| **Pure White** | `#FFFFFF` | `card` / `white` | Kartu produk, modal dialog, search pill | Latar tabel data, kartu KPI |
| **Gold / Amber** | `#F5A623` | `amber-500` | Bintang ulasan rating produk | Status pesanan `pending` |
| **Success Emerald** | `#10B981` | `emerald-600` | Badge stok tersedia, kurir terverifikasi | Status pesanan `paid` & `completed` |
| **Danger Red** | `#EF4444` | `destructive` | Hapus produk keranjang, pesan error validasi | Batalkan pesanan, delete produk |

---

## 🧱 5. Arsitektur Komponen UI (shadcn/ui + Radix UI)

Semua komponen UI menggunakan **shadcn/ui** untuk memaksimalkan modularitas, aksesibilitas keyboard (WCAG AA), dan animasi yang halus:

```
components/
├── ui/                              # shadcn/ui primitives
│   ├── button.tsx                   # Pill-shaped primary buttons
│   ├── input.tsx                    # Clean form input fields
│   ├── table.tsx                    # Admin data table dengan sorting
│   ├── dialog.tsx                   # Modal dialog
│   ├── sheet.tsx                    # Slide-over panel (Cart Drawer & Mobile Filter)
│   ├── card.tsx                     # Rounded-2xl product & stats cards
│   ├── badge.tsx                    # Status & discount tags
│   ├── dropdown-menu.tsx            # User menu & admin action dropdown
│   ├── tabs.tsx                     # Category & order status tabs
│   ├── skeleton.tsx                 # Loading state skeleton
│   ├── avatar.tsx                   # User & AI avatar
│   ├── switch.tsx                   # Toggle switch admin
│   └── sonner.tsx                   # Toast notification system
│
├── layout/
│   ├── navbar.tsx                   # Airbnb-style floating header bar
│   ├── footer.tsx                   # Multi-column store footer
│   ├── mobile-nav.tsx               # Bottom bar navigasi mobile
│   ├── cart-drawer.tsx              # Quick preview keranjang belanja
│   ├── admin-sidebar.tsx            # Sidebar admin dashboard
│   └── admin-header.tsx             # Header status admin
│
├── product/
│   ├── airbnb-search-capsule.tsx    # Floating Search Capsule 3 segmen
│   ├── category-carousel.tsx        # Horizontal category bar
│   ├── product-card.tsx             # Clean product card dengan wishlist button
│   ├── product-grid.tsx             # Grid responsive produk
│   ├── product-filter.tsx           # Multi-facet sidebar filter
│   └── product-reviews.tsx          # Review list pembeli terverifikasi
│
├── chat/
│   ├── chat-bubble.tsx              # User & AI chat bubble
│   ├── chat-embedded-product.tsx    # Kartu produk di dalam chat bubble
│   ├── chat-suggestions.tsx         # Quick prompt chips
│   └── chat-disclaimer.tsx          # Medical disclaimer banner
│
└── admin/
    ├── stats-card.tsx               # Card KPI Omset, Order, Customer, Stok
    ├── sales-chart.tsx              # Grafik tren penjualan 7 hari
    ├── product-form-dialog.tsx      # Modal CRUD produk + beauty metadata
    ├── order-tracking-dialog.tsx    # Modal input nomor resi kurir
    └── master-data-dialog.tsx       # Modal CRUD master data
```

---

## 📱 6. Spesifikasi Halaman Customer

### 6.1. Beranda / Landing Page (`/`)
- Floating Airbnb-style search capsule di atas hero.
- Category carousel bar horizontal.
- Hero editorial banner dengan CTA AI Consultation.
- Section *"Paling Diminati"* (Produk terlaris).
- Section *"Rekomendasi Cerdas AI"* (Kurasi produk berdasarkan jenis kulit).
- Alur 3 Langkah: `01 Analisis` → `02 Rekomendasi` → `03 Belanja`.
- Footer lengkap informasi toko Topshop Bandar Lampung.

### 6.2. AI Beauty Advisor Interface (`/beauty-advisor`)
- Konsultasi chat dua arah yang ramah.
- Quick prompt chips seputar kulit berjerawat, kusam, berminyak, atau skincare rutin.
- **Embedded Product Card:** Kartu rekomendasi produk langsung di dalam balon chat dengan tombol instan *"Tambah ke Keranjang"* atau *"Beli Sekarang"*.
- Medical disclaimer wajib sesuai PRD.
- Riwayat sesi konsultasi tersimpan otomatis untuk user terdaftar.

### 6.3. Katalog Produk & Pencarian (`/products`)
- Filter multi-facet: Brand, Kategori, Tipe Kulit, Masalah Kulit, Range Harga.
- Sorting: Terlaris, Termurah, Termahal, Rating, Terbaru.
- Skeleton loader halus saat memuat data.

### 6.4. Detail Produk (`/products/[id]`)
- Galeri foto interaktif, panel kecocokan kulit, list bahan aktif (*ingredients*), ulasan pembeli verified.

### 6.5. Keranjang & Multi-Step Checkout (`/cart` & `/checkout`)
- Keranjang belanja dengan validasi batas stok live.
- Multi-step checkout: Alamat pengiriman, tarif kurir Biteship real-time, voucher diskon, header `Idempotency-Key`, dan invoice Mayar.
- Halaman sukses checkout dengan nomor order dan link pelacakan paket.

### 6.6. Riwayat Pesanan & Live Tracking (`/orders` & `/orders/[id]`)
- Tab status order, timeline live tracking resi ekspedisi Biteship, tombol bayar/batalkan pesanan, dan form review produk.

---

## 🏢 7. Spesifikasi Halaman Admin Dashboard (`/admin/*`)

Diproteksi otorisasi role `is_admin: true`:
1. **Overview (`/admin/dashboard`):** 4 Kartu KPI omset, grafik tren penjualan 7 hari, tabel peringatan stok menipis (<10 unit), produk terlaris, dan 5 pesanan terbaru.
2. **Manajemen Produk (`/admin/products`):** Tabel produk, modal form tambah/edit produk dengan relasi master data kecantikan, dan aksi hapus.
3. **Manajemen Pesanan (`/admin/orders`):** Filter status pesanan, update status, dan modal input nomor resi kurir Biteship.
4. **Manajemen Pelanggan (`/admin/customers`):** Tabel customer, total transaksi belanja, dan toggle aktivasi akun.
5. **Manajemen Voucher (`/admin/promotions`):** Tabel voucher promosi, modal buat voucher, dan toggle status aktif.
6. **Manajemen Master Data (`/admin/master-data`):** CRUD Kategori, Sub-Kategori, Brand, Tipe Kulit, Masalah Kulit, dan Ingredients.

---

## 🔄 8. Standar Penanganan State (3 Wajib)

1. **Loading State:** Skeleton loader (`<Skeleton />` shadcn) yang persis mencerminkan bentuk komponen akhir.
2. **Empty State:** Ilustrasi minimalis + pesan ramah pengguna + tombol aksi penuntun.
3. **Error State:** Pesan kesalahan manusiawi + tombol *"Coba Lagi"* (`refetch()`).

---

*Terakhir diperbarui: 2026-09-12 — Mengadopsi Airbnb Design Philosophy & 9 Golden Rules of UI/UX*
