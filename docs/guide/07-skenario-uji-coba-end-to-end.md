# 🧪 Bab 7: Skenario Uji Coba Terpadu (End-to-End Walkthrough)

Bab ini menyajikan panduan simulasi langkah demi langkah (*walkthrough test scenarios*) yang dirancang khusus bagi penguji, dosen pembimbing/penguji, maupun tim developer untuk menguji seluruh alur kerja sistem **Topshop Kosmetik AI** secara utuh dari awal hingga akhir.

---

## 🎯 Tujuan Pengujian
Memastikan seluruh alur bisnis utama berjalan mulus tanpa kendala:
`Eksplorasi Katalog` ➔ `Konsultasi AI` ➔ `Registrasi & Login` ➔ `Keranjang & Wishlist` ➔ `Checkout Multi-Kurir` ➔ `Pembayaran Mayar` ➔ `Fulfillment Admin` ➔ `Live Tracking & Ulasan`.

---

## 📋 Langkah Demi Langkah Skenario Pengujian

### 🟢 Skenario 1: Eksplorasi sebagai Pengunjung Tamu (Guest)
1. Buka browser dan arahkan ke alamat website (misal: `http://localhost:3000` atau `https://topshopbeauty.cloud`).
2. **Uji Airbnb Search Capsule:**
   - Di baris pencarian atas, masukkan nama produk *"Serum"* atau *"Sunscreen"*.
   - Pilih tipe kulit *"Berminyak"* dan target masalah *"Jerawat"*.
   - Klik tombol Cari (kaca pembesar) atau tekan `Enter`.
   - **Ekspektasi:** Anda diarahkan ke `/products` dengan hasil filter produk yang sesuai kriteria.
3. **Uji Detail Produk:**
   - Klik salah satu produk untuk membuka `/products/[id]`.
   - Periksa ketersediaan badge kecocokan kulit, daftar bahan aktif (*ingredients*), dan deskripsi pemakaian.

---

### 🟢 Skenario 2: Konsultasi Interaktif dengan AI Beauty Advisor
1. Klik menu **"Konsultasi AI"** di navbar atau buka `/beauty-advisor`.
2. Klik salah satu *Quick Suggestion Chip*, atau ketikkan pertanyaan bebas:
   > *"Kulit saya kusam dan banyak noda hitam bekas jerawat, rekomendasi produk apa yang ampuh dan aman?"*
3. **Ekspektasi:**
   - AI Qwen merespons dalam bahasa Indonesia yang ramah dan ilmiah.
   - Di bawah teks penjelasan, muncul **Kartu Produk Tersemat** yang relevan dengan keluhan tersebut.
4. Klik tombol **"Tambah ke Keranjang"** langsung pada kartu produk di dalam bubble chat.
   - **Ekspektasi:** Counter keranjang belanja di navbar bertambah angka +1.

---

### 🟢 Skenario 3: Pendaftaran Akun Baru & Login
1. Klik menu **"Masuk / Akun"** di kanan atas, lalu pilih *"Daftar Akun Baru"* (`/register`).
2. Isi form: Nama Lengkap, Email aktif, dan Kata Sandi. Klik **"Daftar"**.
3. Jika mode OTP aktif, masukkan 6-digit kode OTP verifikasi yang dikirimkan.
4. Lakukan **Login** dengan kredensial yang baru saja didaftarkan.
5. **Ekspektasi:** Pengguna berhasil login, nama pengguna tampil di navbar, dan token JWT tersimpan aman di cookie/local storage.

---

### 🟢 Skenario 4: Keranjang Belanja & Wishlist
1. Buka halaman Keranjang Belanja (`/cart`):
   - Uji tombol `+` dan `-` pada item belanja (pastikan subtotal harga terhitung otomatis).
   - Uji tombol **"Kembali ke Produk"** di sudut kiri atas.
2. Buka halaman Katalog (`/products`), klik ikon **Hati (Wishlist)** pada salah satu produk lain.
3. Buka halaman Wishlist (`/wishlist`):
   - Pastikan produk tersimpan rapi di daftar favorit.
   - Klik tombol **"Pindah ke Keranjang"** dan pastikan produk berpindah ke keranjang belanja.

---

### 🟢 Skenario 5: Menambahkan Alamat Pengiriman
1. Masuk ke halaman **Buku Alamat** (`/addresses`):
2. Klik tombol **"Tambah Alamat"**:
   - Label: `Rumah`
   - Nama Penerima: `Siti Rahmawati`
   - No HP: `081234567890`
   - Alamat: `Jl. Raden Intan No. 45, Enggal`
   - Provinsi: `Lampung`, Kota: `Bandar Lampung`, Kecamatan: `Enggal`, Kode Pos: `35118`.
   - Centang: *"Jadikan sebagai alamat pengiriman utama"*.
   - Klik **"Simpan Alamat"**.
3. **Ekspektasi:** Alamat baru muncul dalam daftar dan berstatus *Alamat Utama*.

---

### 🟢 Skenario 6: Checkout Multi-Kurir & Voucher Diskon
1. Buka keranjang belanja (`/cart`) dan klik **"Lanjut ke Checkout"** (`/checkout`).
2. **Pilih Alamat:** Alamat utama yang baru saja dibuat terpilih otomatis.
3. **Pilih Ekspedisi (Biteship):**
   - Sistem memuat opsi kurir (JNE / SiCepat / J&T) beserta estimasi tarif ongkos kirim.
   - Pilih salah satu kurir (misal: *JNE Reguler*).
4. **Gunakan Voucher (Opsional):**
   - Masukkan kode voucher toko yang tersedia (misal: `CANTIK10`).
   - Klik *"Gunakan"* dan periksa apakah nilai diskon memotong total belanja.
5. **Ekspektasi:** Rincian Subtotal + Ongkir - Diskon = Grand Total terkalkulasi tepat.

---

### 🟢 Skenario 7: Pembayaran Mayar Payment Gateway
1. Klik tombol **"Bayar Sekarang"**.
2. Anda akan dialihkan ke antarmuka invoice Mayar.
3. Pada lingkungan testing/sandbox:
   - Pilih metode pembayaran **QRIS** atau **Virtual Account**.
   - Selesaikan simulasi pembayaran (atau gunakan simulator sandbox).
4. **Ekspektasi:**
   - Webhook Mayar memproses status transaksi.
   - Pengguna dialihkan ke halaman `/checkout/success` yang menampilkan nomor pesanan resmi.

---

### 🟢 Skenario 8: Pemenuhan Pesanan oleh Admin (Fulfillment)
1. Buka browser lain atau mode incognito, lalu login dengan akun Administrator.
2. Masuk ke **Admin Dashboard** (`/admin/orders`):
   - Cari pesanan yang baru saja dibuat di Skenario 7.
   - Status pesanan berstatus **`paid` (Dibayar)**.
3. Ubah status pesanan menjadi **`processing` (Diproses)** saat barang sedang dikemas.
4. Klik tombol **"Input Resi"**:
   - Pilih kurir: `JNE`
   - Masukkan nomor resi ekspedisi (misal: `JNE9876543210ID`).
   - Klik Simpan.
5. **Ekspektasi:** Status order otomatis berganti menjadi **`shipped` (Dikirim)**.

---

### 🟢 Skenario 9: Live Tracking & Ulasan Pembeli
1. Kembali ke akun pembeli, buka menu **Pesanan Saya** (`/orders`).
2. Klik pesanan tersebut untuk membuka halaman detail (`/orders/[id]`):
   - **Ekspektasi:** Nomor resi kurir tampil dan timeline *Live Tracking Biteship* aktif menunjukkan pergerakan paket.
3. Setelah paket berstatus *completed* (atau diset selesai oleh admin):
   - Klik tombol **"Beri Ulasan"** pada produk.
   - Berikan nilai rating 5 bintang dan testimoni: *"Produk original, pengemasan aman, dan sangat cocok di kulit saya!"*.
   - Klik Kirim.
4. **Ekspektasi:** Ulasan berhasil dipublikasikan dan langsung tampil di halaman detail produk publik (`/products/[id]`).

---

## 📊 Lembar Checklist Hasil Uji Coba

| No | Modul Pengujian | Status | Catatan Evaluasi |
|:---:|---|:---:|---|
| 1 | Pencarian Kapsul Airbnb & Filter Tipe Kulit | [ ] Lolos | |
| 2 | Konsultasi Interaktif AI Qwen & Embedded Product Card | [ ] Lolos | |
| 3 | Autentikasi Pengguna (Register, OTP, Login, JWT) | [ ] Lolos | |
| 4 | Keranjang Belanja, Kontrol Stok, & Wishlist | [ ] Lolos | |
| 5 | Manajemen Buku Alamat Pengiriman | [ ] Lolos | |
| 6 | Kalkulasi Ongkir Kurir Biteship (JNE/SiCepat/J&T) | [ ] Lolos | |
| 7 | Pembayaran Aman Mayar Gateway (QRIS/VA) | [ ] Lolos | |
| 8 | Dashboard Admin (KPI, Katalog, Input Resi Ekspedisi) | [ ] Lolos | |
| 9 | Live Tracking Resi & Publikasi Ulasan Pembeli | [ ] Lolos | |
