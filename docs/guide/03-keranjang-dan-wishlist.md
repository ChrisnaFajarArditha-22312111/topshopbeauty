# 🛒 Bab 3: Keranjang Belanja & Wishlist (Favorit)

Bab ini menjelaskan fitur pengelolaan barang belanjaan (**Keranjang Belanja**) dan penyimpanan produk idaman (**Wishlist / Favorit**) pada website Topshop Kosmetik AI.

---

## 🛍️ 1. Halaman Keranjang Belanja (`/cart`)

Keranjang belanja memungkinkan Anda mengumpulkan produk-produk kosmetik yang ingin dibeli sebelum melanjutkan ke proses pembayaran.

### A. Cara Menambahkan Produk ke Keranjang:
1. Dari **Katalog (`/products`)**: Klik tombol *"Tambah ke Keranjang"* pada kartu produk.
2. Dari **Halaman Detail Produk (`/products/[id]`)**: Tentukan jumlah item lalu klik *"Tambah ke Keranjang"*.
3. Dari **Chat AI Beauty Advisor (`/beauty-advisor`)**: Klik tombol *"Tambah ke Keranjang"* langsung pada kartu rekomendasi produk di dalam bubble chat.

Setelah item ditambahkan, counter badge angka pada ikon tas belanja di navbar atas akan bertambah secara otomatis disertai notifikasi popup (*toast*).

### B. Fitur & Interaksi di Halaman Keranjang:
- **Tombol Kembali (Back Button):** Berada di kiri atas dengan label *"Kembali ke Produk"* untuk memudahkan Anda kembali melihat katalog barang.
- **Kontrol Kuantitas (`+` dan `-`):** 
  - Klik `+` untuk menambah jumlah barang. Sistem secara otomatis mencegah penambahan jika kuantitas melebihi sisa stok fisik di gudang.
  - Klik `-` untuk mengurangi jumlah barang (minimal 1 unit).
- **Hapus Item Satuan:** Klik ikon tempat sampah kecil di sudut kanan kartu item untuk menghapus produk tertentu.
- **Kosongkan Seluruh Keranjang:** Terdapat tombol *"Kosongkan"* di sebelah kanan judul halaman. Dialog konfirmasi akan muncul untuk mencegah penghapusan tanpa sengaja.
- **Ringkasan Belanja (*Sticky Order Summary*):**
  - Menampilkan total item dan subtotal harga belanja secara real-time.
  - Tombol utama **"Lanjut ke Checkout"** membawa Anda ke halaman pengiriman dan pembayaran.

### C. Tampilan Keranjang Kosong (*Empty State*):
Jika belum ada produk yang dimasukkan ke keranjang, halaman menampilkan desain visual yang bersih dan elegan:
- Ilustrasi tas belanja SVG bertema brand Rose/Pink dengan efek animasi mengambang (*floating*).
- Judul *"Keranjang Anda masih kosong"* dan pesan petunjuk ramah.

---

## ❤️ 2. Halaman Wishlist / Favorit Saya (`/wishlist`)

Wishlist berfungsi sebagai wadah untuk menyimpan produk-produk impian yang menarik perhatian Anda tanpa harus langsung membelinya.

### A. Cara Menyimpan ke Wishlist:
1. Pada kartu produk mana pun di katalog atau beranda, klik ikon **Hati (Heart)** di sudut kanan atas foto produk.
2. Ikon hati akan berubah warna menjadi Rose pekat dengan animasi klik halus sebagai konfirmasi produk telah tersimpan.

### B. Fitur & Interaksi di Halaman Wishlist:
- **Tombol Kembali (Back Button):** Berada di kiri atas dengan label *"Kembali ke Profil"* untuk navigasi yang terstruktur.
- **Grid Produk Favorit:** Menampilkan foto produk, rating bintang, nama produk, harga normal, serta harga coret promo diskon.
- **Aksi Pindah ke Keranjang (*Move to Cart*):**
  - Klik tombol *"Pindah ke Keranjang"* pada produk favorit Anda.
  - Produk akan otomatis dipindahkan ke keranjang belanja Anda agar siap di-checkout.
- **Hapus dari Favorit:** Klik ikon tempat sampah pada kartu untuk membatalkan penyimpanan favorit.

### C. Tampilan Wishlist Kosong (*Empty State*):
Ketika wishlist belum terisi produk:
- Menampilkan ilustrasi SVG hati estetik bernuansa pastel rose dengan animasi *floating*.
- Teks panduan informatif: *"Tekan ikon hati ❤️ pada produk yang Anda suka untuk menyimpannya di sini. Beli nanti, kapan saja!"*.
