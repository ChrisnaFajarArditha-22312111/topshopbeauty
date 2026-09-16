# 💳 Bab 4: Checkout & Pembayaran

Bab ini menjelaskan seluruh tahapan transaksi pembelian, mulai dari pemilihan alamat pengiriman, perhitungan tarif kurir ekspedisi real-time, penggunaan voucher diskon, hingga penyelesaian pembayaran melalui payment gateway.

---

## 🛍️ 1. Memulai Alur Checkout (`/checkout`)

Setelah memasukkan produk ke keranjang, klik tombol **"Lanjut ke Checkout"** pada halaman `/cart` (atau klik *"Beli Sekarang"* di halaman detail produk).

Sistem menerapkan prinsip **Multi-Step Checkout yang Mulus & Transparan**:

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. Pilih Alamat │ ──> │ 2. Opsi Kurir   │ ──> │ 3. Klaim Promo  │ ──> │ 4. Bayar Mayar  │
│   Pengiriman    │     │    (Biteship)   │     │    (Voucher)    │     │   (QRIS / VA)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 📍 2. Langkah 1: Memilih Alamat Pengiriman

1. Sistem menampilkan daftar alamat pengiriman yang telah Anda simpan di akun Anda.
2. Alamat yang ditandai sebagai **"Alamat Utama"** akan terpilih secara default.
3. Anda dapat memilih alamat lain atau mengklik tautan **"Tambah Alamat Baru"** untuk memasukkan lokasi pengiriman baru:
   - Masukkan nama penerima, nomor HP WhatsApp, alamat jalan, kecamatan, kota, dan kode pos.
   - Form modal dilengkapi validasi otomatis dan layout scroll yang rapi.

---

## 🚚 3. Langkah 2: Memilih Kurir & Tarif Ongkir (Integrasi Biteship)

Setelah alamat tujuan dipilih, sistem secara otomatis menghubungi API **Biteship** untuk menghitung tarif pengiriman resmi dari gudang Topshop Kosmetik Bandar Lampung ke alamat tujuan Anda:

1. **Pilihan Kurir Ternama:**
   - **JNE** (REG, YES, OKE)
   - **SiCepat** (SIUNT, BEST)
   - **J&T Express** (EZ)
2. **Informasi Lengkap:** Setiap opsi kurir mencantumkan:
   - Nama ekspedisi & tipe layanan.
   - Estimasi waktu pengiriman sampai (contoh: *1-2 hari kerja*).
   - Biaya tarif ongkir akurat sesuai berat produk.
3. Klik pada opsi kurir yang Anda kehendaki untuk memilihnya.

---

## 🎟️ 4. Langkah 3: Menggunakan Voucher Diskon (Opsional)

Jika Anda memiliki kode voucher promosi dari toko:
1. Ketikkan kode voucher pada kolom **"Kode Promo / Voucher"** (contoh: `CANTIK10`, `GLOWINGPROMO`).
2. Klik tombol **"Gunakan"**.
3. Sistem akan memvalidasi syarat kuota, minimal belanja, dan masa berlaku voucher.
4. Potongan diskon akan langsung memotong nilai total belanja pada ringkasan pembayaran.

---

## 🧾 5. Langkah 4: Ringkasan Total & Pembayaran Mayar

Pada panel ringkasan pesanan di sebelah kanan, Anda akan melihat rincian transparan:
- **Subtotal Produk:** Total harga barang yang dibeli.
- **Ongkos Kirim:** Biaya kurir yang dipilih.
- **Diskon Voucher:** Potongan harga (jika voucher digunakan).
- **Total Pembayaran (Grand Total):** Jumlah bersih yang harus dibayar.

### Proses Pembayaran Aman (Mayar.id Gateway):
1. Klik tombol **"Bayar Sekarang"**.
2. Sistem secara otomatis menyisipkan header unik `Idempotency-Key` untuk menjamin keamanan mutlak sehingga tidak akan pernah terjadi pemotongan saldo ganda (*double charge*).
3. Anda akan diarahkan ke halaman invoice resmi Mayar yang mendukung berbagai metode pembayaran instan Indonesia:
   - **QRIS:** Pembayaran instan via GoPay, OVO, DANA, ShopeePay, LinkAja, atau seluruh aplikasi m-banking (BCA Mobile, Livin Mandiri, BRImo, dll).
   - **Virtual Account (VA):** BCA, Bank Mandiri, BNI, BRI, Permata Bank.
   - **Kartu Kredit / Debit Online:** Visa, Mastercard, JCB.

---

## 🎉 6. Halaman Sukses Pembayaran (`/checkout/success`)

Setelah pembayaran berhasil diverifikasi oleh server:
1. Anda akan otomatis dialihkan ke halaman **Konfirmasi Sukses**.
2. Halaman menampilkan:
   - **Nomor Pesanan Unik** (contoh: `ORD-20260913-ABC1234`).
   - Rincian produk dan total nominal yang telah terbayar.
   - Tombol **"Lihat Riwayat Pesanan"** untuk memantau status pesanan dan nomor resi pengiriman.
