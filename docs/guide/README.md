# 📖 Buku Panduan Pengguna & Pengujian Fitur — Topshop Kosmetik AI

Selamat datang di **Buku Panduan Pengguna dan Eksplorasi Fitur Web Topshop Kosmetik AI**. Dokumen ini disusun secara terstruktur untuk memandu pengguna, penguji (*tester*), maupun pengembang dalam mencoba seluruh fitur sistem e-commerce cerdas berbasis AI ini.

---

## 🧭 Peta & Struktur Panduan

Panduan ini terbagi ke dalam 7 bab terstruktur yang mencakup sisi **Pelanggan (Customer)** hingga sisi **Pengelola Toko (Admin)**:

```text
docs/guide/
├── README.md                           # Peta & Pengenalan Buku Panduan
├── 01-eksplorasi-dan-katalog.md        # Bab 1: Navigasi, Pencarian Airbnb, & Detail Produk
├── 02-ai-beauty-advisor.md             # Bab 2: Konsultasi Kulit Cerdas dengan AI Qwen
├── 03-keranjang-dan-wishlist.md        # Bab 3: Pengelolaan Keranjang Belanja & Produk Favorit
├── 04-checkout-dan-pembayaran.md       # Bab 4: Alamat, Ongkir Biteship, Voucher, & Mayar Gateway
├── 05-akun-dan-pelacakan-pesanan.md    # Bab 5: Profil, Buku Alamat, & Live Tracking Kurir
├── 06-admin-dashboard.md               # Bab 6: Operasional Toko, Produk, Order, & Master Data
└── 07-skenario-uji-coba-end-to-end.md  # Bab 7: Skenario Walkthrough Uji Coba dari Awal hingga Akhir
```

---

## 📑 Ringkasan Isi Setiap Bab

| Bab | Topik | Halaman Web Terkait | Pokok Bahasan |
|---|---|---|---|
| [**Bab 1: Eksplorasi & Katalog**](./01-eksplorasi-dan-katalog.md) | Penjelajahan Produk | `/`, `/products`, `/products/[id]` | Search capsule 3-segmen ala Airbnb, filter jenis kulit, filter masalah kulit, kandungan bahan aktif, dan rating pembeli terverifikasi. |
| [**Bab 2: AI Beauty Advisor**](./02-ai-beauty-advisor.md) | Asisten Konsultasi AI | `/beauty-advisor` | Konsultasi kecantikan interaktif dua arah, rekomendasi produk berbasis kecocokan formula, tombol beli instan di balon chat, dan disclaimer medis. |
| [**Bab 3: Keranjang & Wishlist**](./03-keranjang-dan-wishlist.md) | Belanja & Favorit | `/cart`, `/wishlist` | Menambah item belanja, validasi stok live, kontrol kuantitas, simpan favorit impian, dan empty state ramah pengguna. |
| [**Bab 4: Checkout & Pembayaran**](./04-checkout-dan-pembayaran.md) | Transaksi Pembelian | `/checkout`, `/checkout/success` | Integrasi tarif ongkir kurir Biteship (JNE, SiCepat, J&T), kupon diskon, pembayaran instan QRIS/VA via Mayar Payment Gateway. |
| [**Bab 5: Akun & Tracking Pesanan**](./05-akun-dan-pelacakan-pesanan.md) | Pelanggan & Pengiriman | `/profile`, `/addresses`, `/orders`, `/orders/[id]` | Kelola buku alamat pengiriman, status pesanan, timeline live tracking nomor resi kurir, dan ulasan belanja. |
| [**Bab 6: Admin Dashboard**](./06-admin-dashboard.md) | Manajemen Toko | `/admin/*` | Monitoring omset toko, CRUD katalog produk & metadata kecantikan, update status order & input nomor resi, kontrol voucher promosi, dan master data. |
| [**Bab 7: Skenario Pengujian**](./07-skenario-uji-coba-end-to-end.md) | Skenario Walkthrough | Seluruh Halaman | Panduan step-by-step skenario simulasi uji coba lengkap bagi penguji/evaluator (mulai dari guest, konsultasi, order, hingga proses fulfillment oleh admin). |

---

## 🚀 Persiapan Sebelum Mencoba

1. **Jalankan Aplikasi Lokal (Opsional jika menguji di local environment):**
   - **Backend:** `uvicorn app.main:app --reload` pada port `8000`.
   - **Frontend:** `npm run dev` pada port `3000`.
   - Buka browser di [http://localhost:3000](http://localhost:3000).
2. **Atau Akses URL Production:**
   - **Frontend Web:** `https://topshopbeauty.cloud`
   - **API Endpoint:** `https://api.topshopbeauty.cloud`
3. **Akun Uji Coba Default:**
   - **Customer:** Buat akun baru via menu Registrasi (`/register`).
   - **Admin:** Login dengan akun berhak akses admin (`is_admin: true`).

Mari mulai petualangan eksplorasi dari [**Bab 1: Eksplorasi & Katalog Produk**](./01-eksplorasi-dan-katalog.md) atau ikuti [**Bab 7: Skenario Uji Coba End-to-End**](./07-skenario-uji-coba-end-to-end.md) untuk simulasi terpadu!
