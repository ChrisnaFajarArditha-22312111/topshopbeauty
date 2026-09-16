# 🔗 Panduan Integrasi: DNS, CORS, SSL, & Webhooks

Dokumen ini menjelaskan integrasi menyeluruh antara **Frontend (Vercel)** dan **Backend (VPS)** agar kedua sistem dapat berkomunikasi dengan aman, bebas dari isu CORS, dan siap melayani transaksi production.

---

## 🗺️ 1. Pemetaan DNS (DNS Mapping)

Untuk menghubungkan domain utama ke Vercel dan subdomain API ke VPS, atur DNS Record pada DNS Manager Anda (Cloudflare / Niagahoster / Rumahweb / Namecheap / dll.):

| Tipe | Nama Record (Host) | Nilai / Target | Tujuan Layanan | Proxy Status (Jika Cloudflare) |
|---|---|---|---|---|
| `A` atau `CNAME` | `@` (root) | `76.76.21.21` atau `cname.vercel-dns.com` | **Frontend (Vercel)** | DNS Only / Proxied |
| `CNAME` | `www` | `cname.vercel-dns.com` | **Frontend (Vercel)** | DNS Only / Proxied |
| `A` | `api` | `<IP_PUBLIK_VPS_ANDA>` *(contoh: 47.254.120.88)* | **Backend (VPS Linux)** | Proxied (Orange Cloud) / DNS Only |

---

## 🛡️ 2. Konfigurasi CORS (Cross-Origin Resource Sharing)

Karena frontend (`https://topshopbeauty.cloud`) dan backend (`https://api.topshopbeauty.cloud`) berada pada origin yang berbeda, backend FastAPI **wajib** mengizinkan domain Vercel.

### Pengaturan di VPS (`/opt/topshop-kosmetik/.env.production`):
```env
# Daftarkan semua domain yang berhak memanggil API backend (dipisahkan koma)
ALLOWED_ORIGINS=https://topshopbeauty.cloud,https://www.topshopbeauty.cloud,https://topshop-kosmetik-frontend.vercel.app

# URL utama toko untuk tautan redirect email reset password & notifikasi
FRONTEND_URL=https://topshopbeauty.cloud
```

Setelah mengubah file `.env.production`, restart container backend:
```bash
docker compose -f docker-compose.prod.yml restart backend
```

> [!NOTE]
> Backend FastAPI telah dilengkapi dengan middleware `CORSMiddleware` yang membaca variabel `ALLOWED_ORIGINS` secara otomatis dengan konfigurasi:
> - `allow_credentials=True` (mendukung transfer cookie token & header otentikasi)
> - `allow_methods=["*"]` (mendukung GET, POST, PUT, PATCH, DELETE, OPTIONS)
> - `allow_headers=["*"]` (mendukung header custom seperti `Idempotency-Key` dan `Authorization`)

---

## 🔒 3. Penanganan Mixed Content & Protokol HTTPS

Browser modern memblokir permintaan HTTP (tidak aman) yang dipanggil dari halaman HTTPS (aman). Oleh sebab itu:
1. **Frontend di Vercel** secara otomatis diakses via `https://topshopbeauty.cloud`.
2. **Endpoint Backend** yang dimasukkan pada variabel `NEXT_PUBLIC_API_BASE_URL` di Vercel **WAJIB** diawali dengan **`https://`**:
   ```text
   NEXT_PUBLIC_API_BASE_URL=https://api.topshopbeauty.cloud/api/v1
   ```
3. Jika backend belum memiliki sertifikat SSL aktif, browser customer akan memunculkan error:
   ```text
   Mixed Content: The page at 'https://topshopbeauty.cloud/' was loaded over HTTPS,
   but requested an insecure XMLHttpRequest endpoint 'http://api.topshopbeauty.cloud/...'.
   This request has been blocked.
   ```

---

## 🔔 4. Konfigurasi Webhook Pihak Ketiga (Production)

Karena webhook dikirimkan oleh server pihak ketiga (server-to-server), URL webhook **harus mengarah ke domain backend VPS** (bukan ke frontend Vercel):

### A. Webhook Payment Gateway (Mayar.id):
- Masuk ke Dashboard Mayar -> Menu **Pengaturan Integrasi / Webhook**.
- Daftarkan URL Webhook:
  ```text
  https://api.topshopbeauty.cloud/api/v1/checkout/webhook/mayar
  ```
- Salin token **Webhook Secret** dari Mayar ke variabel `MAYAR_WEBHOOK_SECRET` di file `.env.production` VPS.

### B. Webhook Kurir Ekspedisi (Biteship):
- Masuk ke Dashboard Biteship -> Menu **Developer / Webhook**.
- Daftarkan URL Webhook Pelacakan Resi:
  ```text
  https://api.topshopbeauty.cloud/api/v1/shipping/webhook
  ```
- Pilih event: `order.status_updated` dan `tracking.status_updated`.

---

## ✅ 5. Checklist Verifikasi Akhir (Go-Live)

Sebelum website dibuka untuk pelanggan umum, lakukan pengujian seluruh alur:

- [ ] **Akses Web:** Buka `https://topshopbeauty.cloud` di browser (pastikan icon gembok SSL hijau/valid muncul).
- [ ] **Console Browser Bebas Error:** Tekan `F12` -> buka tab **Console** -> pastikan tidak ada pesan merah bertuliskan *CORS Error* atau *Mixed Content*.
- [ ] **Katalog & Filter Produk:** Buka halaman `/products` dan pastikan produk dari database PostgreSQL termuat sempurna.
- [ ] **Konsultasi AI Beauty:** Buka `/beauty-advisor`, kirim satu pertanyaan konsultasi kulit, dan pastikan respon AI Qwen muncul dengan rekomendasi produk yang relevan.
- [ ] **Keranjang & Wishlist:** Coba tambah produk ke keranjang (`/cart`) dan favorit (`/wishlist`), pastikan empty state tampil rapi ketika kosong dan produk tampil rapi saat terisi.
- [ ] **Otentikasi Akun:** Lakukan registrasi akun baru, verifikasi email, dan login. Pastikan token JWT tersimpan di cookie / local storage.
- [ ] **Simulasi Checkout & Ongkir:** Masukkan alamat tujuan pengiriman di `/addresses` dan pastikan tarif kurir Biteship terhitung otomatis di halaman checkout.
- [ ] **Transaksi Uji Coba Mayar:** Lakukan satu transaksi pembayaran uji coba (sandbox/live nominal kecil) dan verifikasi bahwa status order otomatis berganti menjadi `paid`.
