# 👤 Bab 5: Akun Pengguna & Pelacakan Pesanan

Bab ini menjelaskan pengelolaan informasi profil pelanggan, pengaturan alamat pengiriman, riwayat transaksi, hingga pelacakan paket secara real-time (*live tracking*).

---

## 🧑 1. Halaman Profil Akun (`/profile`)

Halaman profil memungkinkan pengguna mengelola data pribadi dan preferensi akun:

### A. Navigasi & Kartu Header Profil:
- **Tombol Kembali (Back Button):** Berada di bagian atas dengan tautan *"Kembali ke Beranda"*.
- **Ringkasan Akun:** Menampilkan inisial avatar pengguna, nama lengkap, alamat email, serta badge status akun terverifikasi.

### B. Fitur & Pengaturan Akun:
1. **Form Edit Informasi Pribadi:**
   - Ubah nama lengkap, nomor WhatsApp aktif, tanggal lahir, dan jenis kelamin.
   - Klik *"Simpan Perubahan"* untuk memperbarui data di database.
2. **Ganti Kata Sandi (Keamanan):**
   - Klik tombol *"Ubah Kata Sandi"*.
   - Modal popup akan meminta input kata sandi lama, kata sandi baru, dan konfirmasi kata sandi baru.
3. **Menu Pintas Cepat (*Quick Action Links*):**
   - **Buku Alamat Pengiriman:** Mengarahkan ke `/addresses`.
   - **Pesanan Saya:** Mengarahkan ke `/orders`.
   - **Favorit Saya (Wishlist):** Mengarahkan ke `/wishlist`.
   - **Keluar Akun (Logout):** Menghapus token otentikasi JWT secara aman dan mengalihkan pengguna kembali ke halaman utama.

---

## 📍 2. Manajemen Buku Alamat (`/addresses`)

Alamat yang tersimpan di sini digunakan secara otomatis saat Anda melakukan checkout:

### A. Menambah Alamat Baru:
1. Klik tombol **"Tambah Alamat"** di sudut kanan atas.
2. Modal dialog akan muncul:
   - **Label Alamat:** Berikan nama pengenal (misal: *Rumah*, *Kantor*, *Kost*).
   - **Nomor HP / WhatsApp:** Kontak aktif penerima paket.
   - **Nama Penerima:** Nama lengkap orang yang akan menerima paket.
   - **Alamat Lengkap:** Nama jalan, nomor rumah, RT/RW, dan patokan lokasi.
   - **Wilayah Administrasi:** Provinsi, Kota/Kabupaten, Kecamatan, dan Kode Pos.
   - **Centang Jadikan Alamat Utama:** Centang jika ingin menjadikannya alamat default untuk pesanan berikutnya.
3. Klik tombol **"Simpan Alamat"**.

### B. Mengubah & Menghapus Alamat:
- Klik ikon pensil untuk memperbarui rincian alamat yang ada.
- Klik ikon tempat sampah untuk menghapus alamat yang sudah tidak digunakan.
- Klik tombol *"Jadikan Alamat Utama"* pada alamat pilihan Anda.

---

## 📦 3. Riwayat Pesanan & Live Tracking (`/orders` & `/orders/[id]`)

Pantau status seluruh pembelian kosmetik Anda dari proses verifikasi hingga kurir mengantarkan paket ke depan pintu rumah Anda:

### A. Tab Status Pesanan:
Halaman `/orders` menyediakan tab filter horizontal:
- **Semua:** Seluruh riwayat transaksi yang pernah dibuat.
- **Menunggu Bayar (`pending`):** Pesanan yang belum diselesaikan pembayarannya. Tersedia tombol *"Bayar Sekarang"* untuk membuka kembali tagihan Mayar.
- **Diproses (`processing`):** Pembayaran telah lunas dan tim gudang Topshop Kosmetik sedang menyiapkan serta mengemas produk Anda.
- **Dikirim (`shipped`):** Paket telah diserahkan ke kurir ekspedisi (JNE / SiCepat / J&T) dan telah memiliki nomor resi resmi.
- **Selesai (`completed`):** Paket telah diterima dengan baik oleh pembeli.
- **Dibatalkan (`cancelled`):** Pesanan dibatalkan karena kedaluwarsa atau permintaan pembeli.

---

### B. Halaman Detail Pesanan & Pelacakan Resi (`/orders/[id]`):
Klik pada salah satu kartu pesanan untuk membuka detail lengkapnya:
1. **Status Badge Berwarna:** Indikator status pesanan yang jelas (Kuning = Pending, Biru = Diproses, Ungu = Dikirim, Hijau = Selesai).
2. **Timeline Live Tracking Biteship:**
   - Jika paket telah dikirim, sistem menyajikan riwayat perjalanan logistik real-time dari kurir:
     - Waktu penjemputan paket (*pick-up*).
     - Transit di hub sortir kota asal & tujuan.
     - Status paket sedang dibawa kurir ke alamat (*with delivery courier*).
     - Paket berhasil diterima (*delivered*).
3. **Faktur Pembelian:** Rincian kuantitas produk, harga beli, biaya ongkir, dan total tagihan.
4. **Beri Ulasan Produk:**
   - Setelah pesanan berstatus *Selesai*, klik tombol **"Beri Ulasan"** pada produk yang Anda beli untuk memberikan nilai bintang (1-5) dan komentar kepuasan produk. Ulasan Anda akan langsung tampil di katalog publik!
