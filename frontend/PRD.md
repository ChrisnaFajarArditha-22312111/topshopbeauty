# 💄 Topshop Kosmetik AI — Frontend Product Requirements Document (PRD)

## 📌 Pendahuluan

Dokumen ini mendefinisikan spesifikasi fungsional, antarmuka pengguna (UI/UX), arsitektur, dan alur aplikasi frontend untuk **Topshop Kosmetik AI** khusus sisi **User / Customer**.

Aplikasi ini berinteraksi langsung dengan REST API FastAPI yang telah selesai dibangun (lihat `docs/API_CONTRACT.md` dan `backend/PRD.md`).

---

## 🎯 Target Pengguna & Karakteristik

- **Pengguna:** Konsumen produk kecantikan dan skincare (wanita & pria usia 17–45 tahun).
- **Perilaku:** Dominan mengakses melalui perangkat mobile/smartphone.
- **Kebutuhan Utama:**
  1. Konsultasi kecantikan interaktif berbasis AI untuk mendapatkan rekomendasi produk yang tepat sesuai jenis kulit, masalah kulit, dan budget.
  2. Katalog produk yang mudah difilter (kategori, brand, skin concern, tipe kulit, harga).
  3. Kemudahan checkout dengan opsi kurir Biteship yang akurat dan pembayaran instan via Mayar.
  4. Manajemen profil, pelacakan paket, dan ulasan produk.

---

## 🛠️ Arsitektur & Tech Stack Frontend

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Library:** shadcn/ui (Radix UI + Lucide React)
- **Data Fetching & Caching:** TanStack Query (React Query v5)
- **HTTP Client:** Axios (Custom client dengan token interceptor, refresh token, & idempotency)
- **Form Handling & Validation:** React Hook Form + Zod
- **Toast Notifications:** Sonner / shadcn Toast

---

## 📱 Daftar Halaman & Fitur Utama

### 1. 🏠 Landing & Beranda (`/`)
- **Header / Navbar:** Logo Topshop Kosmetik, search bar global, icon Keranjang (dengan counter badge), icon Wishlist, menu Profil / Login, dan tombol cepat "Konsultasi AI".
- **Hero Banner:** Promo terbaru, voucher belanja aktif, dan CTA utama untuk konsultasi Beauty Advisor AI.
- **Fitur Unggulan (AI Banner):** Penjelasan singkat fitur AI Beauty Advisor dengan tombol "Coba Konsultasi Gratis".
- **Kategori Populer:** Slider / Grid kategori (Skincare, Makeup, Body Care, dll).
- **Produk Terlaris & Produk Promo:** Carousel kartu produk dengan informasi rating, harga diskon, dan tombol "Tambah ke Keranjang".
- **Footer:** Informasi toko Topshop Kosmetik Bandar Lampung, jam operasional, link bantuan, dan media sosial.

### 2. 🔐 Autentikasi Pengguna (`/(auth)/*`)
- **Register (`/register`):** Form input nama lengkap, email, password, konfirmasi password. Validasi Zod secara live.
- **Verifikasi Email OTP (`/verify-email`):** Input 6-digit OTP dengan countdown timer 10 menit, tombol kirim ulang OTP (cooldown rate-limited).
- **Login Email (`/login`):** Email & password, tombol opsi "Login dengan Google", link "Lupa Password?".
- **Google OAuth Login:** Tombol Google Sign-In yang mengirimkan Google ID Token ke endpoint backend `/api/v1/auth/google`.
- **Lupa Password (`/forgot-password` & `/reset-password`):** Flow input email -> kirim OTP -> verifikasi kode -> masukkan password baru.

### 3. 🛍️ Katalog Produk & Pencarian (`/products`)
- **Fitur Filter Multi-Facet (Sidebar / Mobile Drawer):**
  - Kategori & Sub-Kategori
  - Brand (Garnier, Somethinc, Wardah, dll)
  - Jenis Kulit (Normal, Kering, Berminyak, Sensitif, Kombinasi, Semua Jenis Kulit)
  - Masalah Kulit (Jerawat, Kusam, Garis Halus, Noda Hitam, Pori-pori, dll)
  - Rentang Harga (Min - Max slider/input)
- **Sorting:** Terlaris, Termurah, Termahal, Rating Tertinggi, Produk Terbaru.
- **Live Search Bar:** Pencarian cepat dengan debouncing.
- **Paginasi / Infinite Scroll:** Menampilkan daftar produk secara rapi dengan Skeleton Loading saat memuat data.

### 4. 🧴 Halaman Detail Produk (`/products/[id]`)
- **Galeri Foto Produk:** Tampilan foto utama dan thumbnail preview interaktif.
- **Informasi Produk:** Nama, Brand, Harga normal, Harga coret & persentase diskon, Rating bintang, dan Jumlah terjual.
- **Beauty Metadata Badges:**
  - Cocok untuk Tipe Kulit
  - Mengatasi Masalah Kulit
  - Waktu Penggunaan (Pagi/Malam)
  - Tekstur (Cream/Liquid/Serum, dll)
- **Kandungan Utama (Key Ingredients):** List bahan aktif beserta penjelasan manfaat.
- **Deskripsi Lengkap:** Tab deskripsi produk dan cara penggunaan.
- **Review & Ulasan:** Daftar review dari *verified buyer* dengan filter rating bintang, foto review, dan tanggal.
- **Aksi Cepat:** Counter quantity, tombol "Tambah ke Keranjang", dan tombol "Beli Sekarang".

### 5. 🤖 AI Beauty Advisor (`/beauty-advisor`)
- **Interface Chat Eksklusif:**
  - Desain chat ala personal beauty consultant yang ramah dan interaktif.
  - Tampilan *Quick Suggestion Chips* (contoh: "Rekomendasi serum untuk kulit berjerawat di bawah 50rb", "Sunscreen yang ringan untuk kulit berminyak").
  - Bubble chat pesan user dan pesan AI.
  - Kartu Produk Tersemat (*Embedded Product Cards*) langsung di dalam bubble chat saat AI memberikan rekomendasi.
  - Tombol aksi langsung pada kartu produk: "Beli / Tambah ke Keranjang" dan "Lihat Detail".
  - Banner disclaimer medis otomatis: *"Rekomendasi ini bersifat informatif dan bukan pengganti saran dokter medis/dermatolog."*
- **Riwayat Konsultasi:** Sidebar riwayat percakapan sebelumnya bagi user yang telah login.
- **Akses Fleksibel:** Dapat dicoba langsung oleh pengunjung tanpa login (guest), dan riwayat tersimpan otomatis saat login.

### 6. 🛒 Keranjang Belanja & Wishlist (`/cart` & `/wishlist`)
- **Keranjang Belanja (`/cart`):**
  - List item produk: foto, nama produk, varian/ukuran, harga satuan, subtotal.
  - Kontrol jumlah produk (+ / -) dengan validasi stok instan.
  - Tombol hapus item dan kosongkan keranjang.
  - Ringkasan belanja (Subtotal, Estimasi).
  - Tombol CTA "Lanjut ke Checkout".
- **Wishlist (`/wishlist`):**
  - Grid produk favorit yang disimpan pengguna.
  - Aksi "Pindahkan ke Keranjang" atau "Hapus dari Wishlist".

### 7. 💳 Checkout & Pembayaran (`/checkout`)
- **Multi-Step Checkout yang Mulus:**
  1. **Alamat Pengiriman:** Pilih dari daftar alamat tersimpan atau tambah alamat baru (didukung pencarian area / kota Biteship).
  2. **Pilihan Kurir & Ongkir:** Pilihan kurir real-time dari Biteship (JNE, SiCepat, J&T) dengan estimasi hari sampai dan tarif biaya.
  3. **Voucher Diskon:** Input kode voucher promosi dengan kalkulasi diskon otomatis.
  4. **Ringkasan Total Pembayaran:** Rincian subtotal produk, ongkos kirim, diskon voucher, dan total grand total.
- **Integrasi Pembayaran Mayar:**
  - Pembuatan order dengan header `Idempotency-Key` untuk mencegah pembayaran ganda.
  - Redirect otomatis atau modal invoice pembayaran Mayar (QRIS, VA, E-Wallet, Kartu Kredit).
- **Halaman Sukses Pembayaran (`/checkout/success`):** Menampilkan nomor order dan link untuk melacak pesanan.

### 8. 📦 Manajemen Pesanan & Pelacakan (`/orders` & `/orders/[id]`)
- **Daftar Riwayat Pesanan (`/orders`):** Tab status pesanan (Menunggu Pembayaran, Dibayar, Diproses, Dikirim, Selesai, Dibatalkan).
- **Detail Pesanan (`/orders/[id]`):**
  - Status pesanan terkini dengan status badge warna yang jelas.
  - Rincian produk yang dibeli dan faktur pembayaran.
  - Live Tracking Kurir Biteship (timeline perjalanan resi pengiriman).
  - Tombol "Bayar Sekarang" jika status masih pending.
  - Tombol "Batalkan Pesanan" jika pesanan belum diproses/dikirim.
  - Tombol "Beri Ulasan" setelah pesanan berstatus selesai.

### 9. 👤 Akun & Pengaturan Pengguna (`/profile`, `/addresses`)
- **Profil Pengguna (`/profile`):** Edit nama, nomor telepon, foto profil/avatar, tanggal lahir, dan gender.
- **Buku Alamat (`/addresses`):** Tambah, ubah, hapus alamat pengiriman, dan tetapkan satu sebagai alamat default.
- **Keamanan Akun:** Ubah password akun.

---

## 🎨 Design System & Standar Tampilan

- **Nuansa Warna:**
  - Primary: Rose Gold / Muted Blush (`#E11D48` atau `#F43F5E` rose palette)
  - Secondary: Soft Neutral (`#FDF2F8`, `#FFF1F2`, `#FAFAFA`)
  - Accent / Health: Emerald / Sage Green (untuk indikator organik/aman)
  - Text: Slate 900 untuk teks utama, Slate 500 untuk teks sekunder
- **Tipografi:** Sans-serif modern dan bersih (Geist Sans / Inter).
- **Komponen shadcn/ui Utama:**
  - `Button`, `Input`, `Card`, `Badge`, `Dialog`, `Sheet` (untuk Cart Drawer & Mobile Menu)
  - `DropdownMenu`, `Avatar`, `Skeleton`, `Tabs`, `Accordion`
  - `Sonner` (Toast notification)

---

## 👨‍💼 10. Fitur Admin Dashboard Toko (`/admin/*`)

Semua halaman di bawah route `/admin` dilindungi oleh otorisasi role (`is_admin: true`).

### 10.1. Dashboard Overview (`/admin` atau `/admin/dashboard`)
- **Metrik Utama:** Total omset penjualan lunas, total pesanan toko, total customer terdaftar, dan total produk katalog.
- **Visualisasi Tren:** Grafik tren penjualan 7 hari terakhir.
- **Notifikasi Stok Menipis:** Daftar peringatan produk dengan sisa stok < 10 unit.
- **Aktivitas Terkini:** Produk terlaris dan daftar 5 pesanan terbaru yang masuk.

### 10.2. Manajemen Produk Admin (`/admin/products`)
- **Daftar Produk:** Tabel produk lengkap dengan pencarian, filter kategori, dan status stok.
- **Form Tambah / Edit Produk:** 
  - Input nama produk, deskripsi, harga, harga diskon, dan stok.
  - Relasi Brand, Kategori, dan Sub-Kategori.
  - Atribut Beauty Advisor (Tipe Kulit, Masalah Kulit, Bahan Aktif / Ingredients, Waktu Penggunaan, Tekstur).
  - Galeri URL foto produk.
- **Hapus Produk:** Soft/hard delete dari katalog toko.

### 10.3. Manajemen Pesanan Admin (`/admin/orders` & `/admin/orders/[id]`)
- **Daftar Seluruh Pesanan:** Filter status pesanan (`pending`, `paid`, `processing`, `shipped`, `delivered`, `completed`, `cancelled`).
- **Detail Pesanan:** Rincian barang belanjaan, alamat pengiriman pembeli, status invoice Mayar.
- **Ubah Status Pesanan:** Update status tahapan order.
- **Input Resi Kurir:** Form memasukkan nomor resi ekspedisi (JNE, SiCepat, J&T) yang otomatis mengubah status ke `shipped` dan mengaktifkan tracking Biteship.

### 10.4. Manajemen Pelanggan (`/admin/customers`)
- **Daftar Pengguna:** Melihat customer toko, total transaksi belanja, dan tanggal bergabung.
- **Keamanan:** Password di-hash dan tidak pernah ditampilkan ke admin.
- **Kontrol Akun:** Toggle aktif/non-aktif akun atau toggle hak akses Admin.

### 10.5. Manajemen Promosi & Voucher (`/admin/promotions`)
- **Daftar & Buat Voucher:** Kode promo, tipe diskon (% atau nominal), kuota, masa berlaku, dan minimal belanja.
- **Toggle Status:** Aktifkan / nonaktifkan voucher promosi secara real-time.

### 10.6. Manajemen Master Data Kecantikan (`/admin/master-data`)
- CRUD master data: Kategori, Sub-Kategori, Brand, Skin Types, Skin Concerns, dan Ingredients untuk memperluas database rekomendasi AI.
