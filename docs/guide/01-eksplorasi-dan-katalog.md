# 🔍 Bab 1: Eksplorasi & Katalog Produk

Bab ini menjelaskan cara menjelajahi produk kosmetik dan skincare pada website **Topshop Kosmetik AI**, mulai dari Beranda hingga Halaman Detail Produk.

---

## 🏡 1. Menjelajahi Beranda (Landing Page)

Halaman utama (`/`) dirancang dengan filosofi kesederhanaan **Airbnb-Style Simplicity**:

### A. Floating Search Capsule (Airbnb-Style Search Pill)
Di bagian atas halaman utama, terdapat kapsul pencarian interaktif yang terbagi menjadi 3 segmen:
1. **Segmen 1 (Cari Produk / Brand):** Ketikkan nama produk atau merk yang dicari (misal: *"Serum Somethinc"*, *"Sunscreen Wardah"*).
2. **Segmen 2 (Tipe Kulit):** Pilih tipe kulit Anda (*Semua, Berminyak, Kering, Sensitif, Normal, Kombinasi*).
3. **Segmen 3 (Target Masalah Kulit):** Pilih fokus perawatan (*Jerawat, Kusam, Noda Hitam, Anti-Aging*).
4. **Tombol Cari Bulat:** Klik ikon kaca pembesar berwarna Rose/Plum untuk langsung diarahkan ke katalog produk dengan filter yang telah terpasang otomatis.

> [!TIP]
> Tekan tombol shortcut keyboard **`/`** pada keyboard Anda untuk langsung memfokuskan kursor ke kapsul pencarian.

### B. Category Carousel Bar
Tepat di bawah banner hero, terdapat deretan kategori produk horizontal yang dapat digeser (*scrollable*):
- Ikon kategori mencakup: *Cleanser, Toner, Serum, Moisturizer, Sunscreen, Acne Care, Makeup, Masker*.
- Klik pada salah satu kategori untuk memfilter produk secara instan tanpa perlu memuat ulang halaman.

---

## 🛍️ 2. Halaman Katalog & Pencarian Multi-Facet (`/products`)

Halaman katalog menyediakan kemampuan filter yang mendalam untuk memudahkan konsumen menemukan produk yang tepat:

### A. Fitur Multi-Facet Filter (Sidebar / Mobile Drawer):
- **Kategori & Sub-Kategori:** Pilih jenis perawatan (misal: Perawatan Wajah -> Serum).
- **Brand:** Centang merk pilihan (Garnier, Somethinc, Wardah, Skintific, Avoskin, dll).
- **Jenis Kulit:** Filter berdasarkan kecocokan tipe kulit pengguna.
- **Masalah Kulit:** Saring produk yang diformulasikan khusus untuk mengatasi jerawat (*acne*), mencerahkan kulit (*brightening*), atau perbaikan skin barrier.
- **Rentang Harga:** Masukkan batas harga minimal dan maksimal sesuai budget Anda.

### B. Opsi Sorting (Pengurutan):
Pada sudut kanan atas katalog, Anda dapat mengurutkan daftar produk berdasarkan:
1. **Terlaris:** Produk dengan kuantitas penjualan tertinggi di toko.
2. **Terbaru:** Produk yang baru saja ditambahkan ke etalase toko.
3. **Harga Terendah / Tertinggi:** Urutkan berdasarkan nominal harga.
4. **Rating Tertinggi:** Produk dengan ulasan bintang terbaik dari pembeli.

---

## 🧴 3. Halaman Detail Produk (`/products/[id]`)

Klik pada salah satu kartu produk untuk membuka halaman detail yang komprehensif:

1. **Galeri Foto Produk:**
   - Foto produk beresolusi tinggi dengan thumbnail pendukung. Arahkan mouse atau sentuh untuk melihat detail fisik kemasan.
2. **Badge Metadata Kecantikan (Beauty Attributes):**
   - **Tipe Kulit:** Menampilkan label jelas apakah produk cocok untuk kulit berminyak, kering, atau sensitif.
   - **Target Masalah:** Tag penanda manfaat utama (misal: *Acne-Safe*, *Non-Comedogenic*).
   - **Waktu Penggunaan:** Ikon penanda waktu pakai (*Pagi*, *Malam*, atau *Pagi & Malam*).
   - **Tekstur:** Informasi tekstur formula (misal: *Watery Serum*, *Gel Cream*).
3. **Kandungan Utama (*Key Active Ingredients*):**
   - Rincian bahan aktif penting (contoh: *Niacinamide 10%*, *Salicylic Acid*, *Ceramide*) beserta penjelasan fungsinya bagi kulit.
4. **Ulasan Pembeli Terverifikasi (*Verified Reviews*):**
   - Ulasan asli dari konsumen yang telah menyelesaikan transaksi, dilengkapi nilai bintang (1-5), komentar tekstual, dan tanggal pembelian.
5. **Tombol Aksi Pembelian:**
   - Pengatur jumlah barang (*Quantity Controller* `+` dan `-`) yang langsung memvalidasi batas stok gudang.
   - **Tambah ke Keranjang:** Memasukkan produk ke keranjang belanja dengan notifikasi animasi halus.
   - **Beli Sekarang:** Membawa pengguna langsung ke proses checkout instan (*bypass* keranjang).
