# 🏢 Bab 6: Dashboard Administrator Toko

Bab ini menjelaskan operasional toko khusus untuk staf dan pemilik toko (**Administrator**) melalui antarmuka **Admin Dashboard** (`/admin/*`).

> [!NOTE]
> Halaman Admin dilindungi sistem otorisasi khusus. Hanya akun dengan atribut `is_admin: true` yang diizinkan mengakses menu ini.

---

## 📊 1. Overview Dashboard (`/admin` atau `/admin/dashboard`)

Halaman utama dashboard menyajikan ringkasan performa bisnis toko kosmetik secara komprehensif:

1. **4 Kartu Metrik KPI Utama:**
   - **Total Omset Toko:** Akumulasi pendapatan bersih dari transaksi yang telah berstatus lunas (*paid* / *completed*).
   - **Total Pesanan:** Jumlah seluruh order yang masuk ke sistem.
   - **Total Pelanggan Terdaftar:** Jumlah konsumen aktif yang memiliki akun di toko.
   - **Total Katalog Produk:** Jumlah item SKU produk yang aktif dijual.
2. **Grafik Tren Penjualan 7 Hari Terakhir:**
   - Visualisasi grafik batang/garis interaktif untuk memantau fluktuasi omset harian.
3. **Peringatan Stok Menipis (*Low Stock Alert*):**
   - Tabel peringatan dini untuk produk dengan sisa stok kurang dari **10 unit** agar tim gudang segera melakukan *restock*.
4. **Pesanan Terbaru:**
   - Daftar 5 pesanan terakhir yang membutuhkan penanganan cepat (*fulfillment*).

---

## 💄 2. Manajemen Produk & Beauty Attributes (`/admin/products`)

Admin memiliki kendali penuh atas katalog barang dan data formulasi kecantikan:

### A. Fitur Tabel Produk:
- Pencarian produk berdasarkan nama atau SKU.
- Filter berdasarkan kategori barang dan ketersediaan stok.
- Aksi: Tambah Produk Baru, Ubah Produk (*Edit*), dan Hapus Produk.

### B. Form Tambah / Edit Produk (Integrasi AI Metadata):
Selain data e-commerce standar (Nama, Harga, Harga Diskon, Stok Gudang, Deskripsi, dan URL Foto), form ini memuat **Atribut Kecantikan Khusus AI**:
- **Tipe Kulit yang Cocok:** Normal, Kering, Berminyak, Sensitif, Kombinasi, atau Semua Jenis Kulit.
- **Masalah Kulit Sasaran:** Jerawat, Kulit Kusam, Noda Hitam, Garis Halus, dll.
- **Bahan Aktif (*Active Ingredients*):** Menghubungkan produk dengan kandungan aktifnya (misal: *Niacinamide*, *Centella Asiatica*). Data ini digunakan oleh AI Beauty Advisor untuk melakukan pencocokan rekomendasi produk secara akurat!
- **Waktu Pemakaian & Tekstur:** Pagi/Malam, serta jenis formula (*Gel, Cream, Serum, Liquid*).

---

## 📦 3. Manajemen Pesanan & Input Resi Kurir (`/admin/orders`)

Mengelola alur pemenuhan pesanan dari verifikasi pembayaran hingga pengiriman ekspedisi:

1. **Filter Tab Status Pesanan:**
   - Menampilkan pesanan sesuai tahapannya: *Pending*, *Paid*, *Processing*, *Shipped*, *Completed*, *Cancelled*.
2. **Memproses Pesanan Baru:**
   - Ketika ada order berstatus *Paid* (telah dibayar via Mayar), admin menyiapkan barang di gudang dan mengubah status menjadi *Processing*.
3. **Input Nomor Resi Kurir:**
   - Klik tombol **"Input Resi"** pada pesanan yang siap dikirim.
   - Masukkan nama kurir (JNE, SiCepat, atau J&T) beserta **Nomor Resi Resmi**.
   - Sistem secara otomatis mengubah status order menjadi **`shipped` (Dikirim)** dan mengaktifkan integrasi pelacakan otomatis API Biteship. Pembeli akan langsung dapat memantau perjalanan paket di akun mereka!

---

## 👥 4. Manajemen Pelanggan (`/admin/customers`)

- Melihat daftar seluruh customer terdaftar beserta total nominal belanja yang pernah mereka lakukan.
- Membuka riwayat detail transaksi seorang pelanggan.
- **Kontrol Keamanan Akun:** Admin dapat menonaktifkan akun yang terindikasi mencurigakan melalui tombol toggle status aktif.

---

## 🎟️ 5. Manajemen Promosi & Voucher Diskon (`/admin/promotions`)

Buat dan kelola kupon belanja untuk memikat konsumen:
- **Kode Voucher:** Buat kode unik huruf kapital (misal: `GAJIAN20`, `BEAUTYGLOW`).
- **Tipe Potongan:** Pilihan potongan persentase (misal: *20%*) atau nominal rupiah tetap (misal: *Rp 25.000*).
- **Aturan Pembelian:** Tentukan batas minimal nilai belanja dan batas maksimum kuota klaim.
- **Masa Berlaku:** Tanggal mulai dan tanggal kedaluwarsa voucher.
- **Toggle Status:** Aktifkan atau nonaktifkan voucher secara instan kapan saja.

---

## 🗂️ 6. Manajemen Master Data Kecantikan (`/admin/master-data`)

Pusat kendali taksonomi kecantikan toko yang menjadi basis pengetahuan sistem AI:
- **Kategori & Sub-Kategori:** Struktur klasifikasi produk toko.
- **Merk (Brand):** Daftar produsen kosmetik mitra toko.
- **Tipe Kulit & Masalah Kulit:** Taksonomi kondisi kulit.
- **Bahan Aktif (*Ingredients*):** Database bahan kimia & herbal kosmetik beserta fungsi dermatologisnya.
