# 🤖 Bab 2: AI Beauty Advisor (Konsultasi Kulit Cerdas)

Fitur unggulan utama dari **Topshop Kosmetik AI** adalah **AI Beauty Advisor**, sebuah sistem konsultasi kecantikan interaktif berbasis kecerdasan buatan (*Large Language Model* Alibaba Qwen) yang telah dipadukan secara mendalam dengan katalog produk toko Topshop Kosmetik Bandar Lampung.

---

## 💡 1. Konsep & Keunggulan AI Beauty Advisor

Berbeda dengan chatbot generik, AI Beauty Advisor Topshop Kosmetik dirancang memiliki pemahaman dermatologis dasar dan basis pengetahuan formulasi kosmetik:
1. **Analisis Masalah Kulit Personal:** Memahami kondisi spesifik pengguna (tipe kulit, keluhan jerawat, kulit sensitif, ibu hamil/menyusui, dan batasan budget).
2. **Rekomendasi Produk Nyata yang Tersedia di Toko:** Bukan sekadar memberikan saran teoritis, AI langsung menyajikan produk spesifik yang stoknya tersedia di database toko.
3. **Kartu Produk Tersemat (*Embedded Product Cards*):** Konsumen dapat langsung melihat harga, foto, dan menekan tombol beli langsung dari dalam percakapan chat.

---

## 💬 2. Cara Menggunakan Halaman Konsultasi (`/beauty-advisor`)

Akses halaman konsultasi melalui tombol **"Konsultasi AI"** di navbar atas atau kunjungi URL `/beauty-advisor`.

### A. Quick Suggestion Chips (Pertanyaan Kilat)
Saat pertama kali membuka chat, Anda akan melihat tombol rekomendasi pertanyaan instan:
- *"Rekomendasi serum untuk bekas jerawat kehitaman (PIH)"*
- *"Sunscreen yang ringan & tidak membuat wajah berminyak di bawah 70rb"*
- *"Urutan basic skincare untuk pemula dengan kulit kering"*
- *"Pelembap yang aman untuk memperbaiki skin barrier yang rusak"*

Klik salah satu chip untuk langsung mengirimkan pertanyaan tersebut.

### B. Mengetik Pertanyaan Bebas
Anda dapat mengetikkan keluhan kulit dalam bahasa Indonesia santai sehari-hari di kolom input chat.

**Contoh Pertanyaan yang Efektif:**
> *"Halo, kulit saya kombinasi (berminyak di area T-zone tapi kering di pipi), sering muncul bruntusan di dahi. Ada rekomendasi sabun cuci muka dan toner yang cocok dengan budget di bawah 150 ribu?"*

### C. Berinteraksi dengan Kartu Produk di Dalam Chat
Ketika AI memberikan jawaban:
1. AI akan menjelaskan alasan ilmiah mengapa bahan aktif tertentu cocok untuk masalah kulit Anda.
2. Di bawah teks penjelasan, akan muncul **Kartu Produk Interaktif**:
   - Menampilkan foto produk, nama resmi, merk, dan harga terkini.
   - **Tombol "Tambah ke Keranjang":** Menambahkan produk langsung ke keranjang Anda tanpa meninggalkan percakapan chat.
   - **Tautan Produk:** Klik nama produk untuk membuka halaman detail spesifikasi lengkap.

---

## 📜 3. Riwayat Konsultasi (Chat History)

- **Pengguna Terdaftar (Login):** Seluruh percakapan konsultasi Anda tersimpan secara otomatis di server. Anda dapat membuka kembali saran produk sebelumnya kapan saja melalui panel sidebar riwayat sesi di sebelah kiri.
- **Pengguna Tamu (Guest):** Anda tetap dapat berkonsultasi secara bebas tanpa perlu login terlebih dahulu. Jika Anda ingin riwayat percakapan tersimpan permanen, cukup lakukan login atau registrasi akun.

---

## ⚠️ 4. Disclaimer Medis

Pada bagian bawah layar chat terdapat banner peringatan resmi:
> *"Saran dan rekomendasi produk oleh AI Beauty Advisor bersifat informatif berdasarkan data katalog kosmetik dan bukan pengganti diagnosis medis resmi oleh dokter spesialis kulit (dermatolog). Untuk kondisi penyakit kulit kronis atau infeksi parah, silakan berkonsultasi langsung dengan dokter."*
