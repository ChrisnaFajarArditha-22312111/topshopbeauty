# 📋 Kontrak API — Topshop Kosmetik AI

> **Base URL:** `https://api.yourdomain.com` | **Version:** `1.0.0` | **OpenAPI:** `3.1.0`

> 🌐 = Public (tanpa auth) | 🔒 = JWT Bearer Token required (`Authorization: Bearer <token>`)

> `*` = required field | `?` = optional field

---

## 📑 Daftar Isi

- [Auth](#auth)
- [Users](#users)
- [Profiles](#profiles)
- [Addresses](#addresses)
- [Products](#products)
- [Categories](#categories)
- [Brands](#brands)
- [Skin Types](#skin-types)
- [Skin Concerns](#skin-concerns)
- [Cart](#cart)
- [Wishlist](#wishlist)
- [Checkout](#checkout)
- [Orders](#orders)
- [Payments](#payments)
- [Shipping](#shipping)
- [Promotions](#promotions)
- [Reviews](#reviews)
- [Beauty Advisor](#beauty-advisor)
- [Admin](#admin)

---

## Auth

### 🌐 `POST /api/v1/auth/register`

**Registrasi Akun Baru**

_Mendaftar akun baru dengan email dan password. Kode OTP 6-digit akan dikirim ke email._


**Request Body** (`RegisterRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `full_name` | string | ✅ | Nama lengkap pengguna |
| `email` | string(email) | ✅ | Alamat email aktif |
| `password` | string | ✅ | Password minimal 8 karakter |
| `confirm_password` | string | ✅ |  |


**Response** `200/201` (`MessageResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ |  |
| `detail` | string \| null | — |  |

---

### 🌐 `POST /api/v1/auth/verify-email`

**Verifikasi Email dengan Kode OTP**

_Verifikasi email pengguna baru menggunakan kode OTP 6-digit._


**Request Body** (`VerifyEmailRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string(email) | ✅ |  |
| `code` | string | ✅ | 6 digit angka OTP |


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

### 🌐 `POST /api/v1/auth/resend-verification`

**Kirim Ulang Kode OTP Verifikasi Email**

_Mengirim ulang kode OTP verifikasi jika pengguna belum menerima atau kode kedaluwarsa._


**Request Body** (`ResendVerificationRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string(email) | ✅ |  |


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

### 🌐 `POST /api/v1/auth/login`

**Login Email & Password**

_Login dengan email dan password. Menghasilkan JWT Access Token dan Refresh Token._


**Request Body** (`LoginRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string(email) | ✅ |  |
| `password` | string | ✅ |  |


**Response** `200/201` (`TokenResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `access_token` | string | ✅ |  |
| `refresh_token` | string | ✅ |  |
| `token_type` | string | — | default: `bearer` |
| `expires_in` | integer | ✅ |  |

---

### 🌐 `POST /api/v1/auth/google`

**Login / Registrasi dengan Google OAuth**

_Login atau daftar otomatis menggunakan Google ID Token yang divalidasi backend._


**Request Body** (`GoogleAuthRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id_token` | string | ✅ | Google JWT ID Token dari frontend |


**Response** `200/201` (`TokenResponse`):

_Lihat schema `TokenResponse` di atas._

---

### 🌐 `POST /api/v1/auth/forgot-password`

**Permintaan Reset Password (Kirim OTP)**

_Mengirimkan kode OTP reset password ke alamat email yang terdaftar._


**Request Body** (`ForgotPasswordRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string(email) | ✅ |  |


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

### 🌐 `POST /api/v1/auth/verify-reset-code`

**Verifikasi Kode OTP Reset Password**

_Validasi apakah kode OTP reset password pengguna benar sebelum input password baru._


**Request Body** (`VerifyResetCodeRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string(email) | ✅ |  |
| `code` | string | ✅ |  |


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

### 🌐 `POST /api/v1/auth/reset-password`

**Tetapkan Password Baru**

_Memperbarui password pengguna setelah verifikasi kode OTP berhasil._


**Request Body** (`ResetPasswordRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string(email) | ✅ |  |
| `code` | string | ✅ |  |
| `new_password` | string | ✅ |  |
| `confirm_password` | string | ✅ |  |


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

### 🌐 `POST /api/v1/auth/refresh`

**Perbarui JWT Access Token**

_Memperbarui access token yang telah kedaluwarsa dengan refresh token yang valid._


**Request Body** (`RefreshTokenRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refresh_token` | string | ✅ |  |


**Response** `200/201` (`TokenResponse`):

_Lihat schema `TokenResponse` di atas._

---

### 🔒 `POST /api/v1/auth/logout`

**Logout Pengguna**

_Mencabut semua sesi login aktif untuk user yang sedang terautentikasi._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

## Users

### 🔒 `GET /api/v1/users/me`

**Data Akun Saya**

_Melihat informasi akun user yang sedang login._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201` (`UserResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `email` | string(email) | ✅ |  |
| `email_verified` | boolean | ✅ |  |
| `is_active` | boolean | ✅ |  |
| `is_admin` | boolean | ✅ |  |
| `created_at` | string(date-time) | ✅ |  |
| `updated_at` | string(date-time) | ✅ |  |

---

### 🔒 `POST /api/v1/users/change-password`

**Ubah Password**

_Mengganti password akun user saat sedang login._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`ChangePasswordRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `old_password` | string | ✅ |  |
| `new_password` | string | ✅ |  |


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

## Profiles

### 🔒 `GET /api/v1/profile`

**Ambil Informasi Profile User**

_Mendapatkan informasi profil pengguna yang sedang login._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201` (`ProfileResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `full_name` | string | ✅ |  |
| `phone` | string \| null | — |  |
| `avatar_url` | string \| null | — |  |
| `date_of_birth` | string(date) \| null | — |  |
| `gender` | string \| null | — |  |
| `bio` | string \| null | — |  |
| `id` | string(uuid) | ✅ |  |
| `user_id` | string(uuid) | ✅ |  |
| `email` | string \| null | — |  |
| `created_at` | string(date-time) | ✅ |  |
| `updated_at` | string(date-time) | ✅ |  |

---

### 🔒 `PATCH /api/v1/profile`

**Perbarui Informasi Profile User**

_Memperbarui informasi profil pengguna yang sedang login._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`ProfileUpdate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `full_name` | string \| null | — |  |
| `phone` | string \| null | — |  |
| `avatar_url` | string \| null | — |  |
| `date_of_birth` | string(date) \| null | — |  |
| `gender` | string \| null | — |  |
| `bio` | string \| null | — |  |


**Response** `200/201` (`ProfileResponse`):

_Lihat schema `ProfileResponse` di atas._

---

## Addresses

### 🔒 `GET /api/v1/addresses`

**Daftar Alamat Pengguna**

_Mendapatkan seluruh daftar alamat pengiriman milik user._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201`: array of `AddressResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | — | default: `Rumah` |
| `recipient_name` | string | ✅ |  |
| `phone` | string | ✅ |  |
| `address` | string | ✅ |  |
| `province` | string | ✅ |  |
| `city` | string | ✅ |  |
| `district` | string | ✅ |  |
| `postal_code` | string | ✅ |  |
| `is_default` | boolean | — | default: `False` |
| `id` | string(uuid) | ✅ |  |
| `user_id` | string(uuid) | ✅ |  |
| `created_at` | string(date-time) | ✅ |  |
| `updated_at` | string(date-time) | ✅ |  |

---

### 🔒 `POST /api/v1/addresses`

**Tambah Alamat Baru**

_Menambahkan alamat pengiriman baru untuk user._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`AddressCreate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | — | default: `Rumah` |
| `recipient_name` | string | ✅ |  |
| `phone` | string | ✅ |  |
| `address` | string | ✅ |  |
| `province` | string | ✅ |  |
| `city` | string | ✅ |  |
| `district` | string | ✅ |  |
| `postal_code` | string | ✅ |  |
| `is_default` | boolean | — | default: `False` |


**Response** `200/201` (`AddressResponse`):

_Lihat schema `AddressResponse` di atas._

---

### 🔒 `GET /api/v1/addresses/{address_id}`

**Detail Alamat**

_Melihat detail satu alamat pengiriman._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `address_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`AddressResponse`):

_Lihat schema `AddressResponse` di atas._

---

### 🔒 `PATCH /api/v1/addresses/{address_id}`

**Update Alamat**

_Mengubah data alamat pengiriman._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `address_id` | path | string(uuid) | ✅ |  |


**Request Body** (`AddressUpdate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string \| null | — |  |
| `recipient_name` | string \| null | — |  |
| `phone` | string \| null | — |  |
| `address` | string \| null | — |  |
| `province` | string \| null | — |  |
| `city` | string \| null | — |  |
| `district` | string \| null | — |  |
| `postal_code` | string \| null | — |  |
| `is_default` | boolean \| null | — |  |


**Response** `200/201` (`AddressResponse`):

_Lihat schema `AddressResponse` di atas._

---

### 🔒 `DELETE /api/v1/addresses/{address_id}`

**Hapus Alamat**

_Menghapus alamat pengiriman._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `address_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

### 🔒 `PATCH /api/v1/addresses/{address_id}/default`

**Set Alamat Utama**

_Menetapkan alamat terpilih menjadi alamat utama pengiriman._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `address_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`AddressResponse`):

_Lihat schema `AddressResponse` di atas._

---

## Products

### 🌐 `GET /api/v1/products`

**Katalog Produk dengan Filter & Sorting**

_Menampilkan daftar produk dengan kemampuan filter, pencarian, dan pagination._


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `q` | query | string \| null | — | Kata kunci pencarian nama atau deskripsi |
| `category` | query | string \| null | — | Filter nama kategori |
| `brand` | query | string \| null | — | Filter nama brand |
| `skin_type` | query | string \| null | — | Filter kecocokan tipe kulit |
| `skin_concern` | query | string \| null | — | Filter permasalahan kulit |
| `min_price` | query | number(min:0.0) \| null | — | Harga minimum |
| `max_price` | query | number(min:0.0) \| null | — | Harga maksimum |
| `is_skincare` | query | boolean \| null | — | Hanya produk skincare |
| `sort_by` | query | string \| null | — | default: `terlaris` |
| `page` | query | integer(min:1) | — | default: `1` |
| `page_size` | query | integer(min:1, max:100) | — | default: `20` |


**Response** `200/201` (`PaginatedProductsResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total` | integer | ✅ |  |
| `page` | integer | ✅ |  |
| `page_size` | integer | ✅ |  |
| `total_pages` | integer | ✅ |  |
| `items` | array\[`ProductListResponse`\] | ✅ |  |

---

### 🌐 `GET /api/v1/products/{product_id}`

**Detail Lengkap Produk**

_Mengambil informasi detail produk, gambar galeri, tipe kulit, masalah kulit, dan kandungan._


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `product_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`ProductDetailResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `item_id` | integer \| null | — |  |
| `nama_produk` | string | ✅ |  |
| `brand_name` | string \| null | — |  |
| `category_name` | string \| null | — |  |
| `harga` | number | ✅ |  |
| `harga_asli` | number \| null | — |  |
| `diskon_persen` | string \| null | — |  |
| `stok` | integer | ✅ |  |
| `terjual` | integer | ✅ |  |
| `rating` | number | ✅ |  |
| `foto_utama` | string \| null | — |  |
| `is_skincare` | boolean | ✅ |  |
| `usage_time` | string \| null | — |  |
| `texture` | string \| null | — |  |
| `shop_id` | integer \| null | — |  |
| `sub_category_name` | string \| null | — |  |
| `url_produk` | string \| null | — |  |
| `search_document` | string \| null | — |  |
| `images` | array\[`ProductImageResponse`\] | — |  |
| `skin_types` | array\[`SkinTypeResponse`\] | — |  |
| `skin_concerns` | array\[`SkinConcernResponse`\] | — |  |
| `ingredients` | array\[`IngredientResponse`\] | — |  |

---

## Categories

### 🌐 `GET /api/v1/categories`

**Daftar Seluruh Kategori**

_Mengambil seluruh data kategori dan subkategori kosmetik._


**Response** `200/201`: array of `CategoryResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `name` | string | ✅ |  |
| `slug` | string | ✅ |  |
| `description` | string \| null | — |  |
| `sub_categories` | array\[`SubCategoryResponse`\] | — |  |

---

## Brands

### 🌐 `GET /api/v1/brands`

**Daftar Seluruh Brand**

_Mengambil seluruh data brand kosmetik dan skincare._


**Response** `200/201`: array of `BrandResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `name` | string | ✅ |  |
| `slug` | string | ✅ |  |
| `description` | string \| null | — |  |
| `logo_url` | string \| null | — |  |

---

## Skin Types

### 🌐 `GET /api/v1/skin-types`

**Daftar Tipe Kulit**

_Mengambil seluruh master data tipe kulit (All Skin Types, Dry, Oily, Sensitive, dll)._


**Response** `200/201`: array of `SkinTypeResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `name` | string | ✅ |  |
| `description` | string \| null | — |  |

---

## Skin Concerns

### 🌐 `GET /api/v1/skin-concerns`

**Daftar Permasalahan Kulit**

_Mengambil seluruh master data masalah kulit (Acne, Dullness, Hydration, Dark Spots, dll)._


**Response** `200/201`: array of `SkinConcernResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `name` | string | ✅ |  |
| `description` | string \| null | — |  |

---

## Cart

### 🔒 `GET /api/v1/cart`

**Lihat Keranjang Belanja**

_Mengambil isi keranjang belanja user._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201` (`CartResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `items` | array\[`CartItemResponse`\] | — |  |
| `total_items` | integer | ✅ |  |
| `total_price` | number | ✅ |  |

---

### 🔒 `DELETE /api/v1/cart`

**Kosongkan Seluruh Keranjang**

_Mengosongkan semua produk yang ada di dalam keranjang belanja._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201` (`CartResponse`):

_Lihat schema `CartResponse` di atas._

---

### 🔒 `POST /api/v1/cart/items`

**Tambah Item ke Keranjang**

_Menambahkan produk ke dalam keranjang._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`AddToCartRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | string(uuid) | ✅ |  |
| `quantity` | integer(min:1.0) | — | default: `1` |


**Response** `200/201` (`CartResponse`):

_Lihat schema `CartResponse` di atas._

---

### 🔒 `PATCH /api/v1/cart/items/{item_id}`

**Ubah Kuantitas Item**

_Mengubah jumlah kuantitas produk dalam keranjang._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `item_id` | path | string(uuid) | ✅ |  |


**Request Body** (`UpdateCartItemRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `quantity` | integer(min:1.0) | ✅ |  |


**Response** `200/201` (`CartResponse`):

_Lihat schema `CartResponse` di atas._

---

### 🔒 `DELETE /api/v1/cart/items/{item_id}`

**Hapus Item dari Keranjang**

_Menghapus satu produk dari keranjang._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `item_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`CartResponse`):

_Lihat schema `CartResponse` di atas._

---

## Wishlist

### 🔒 `GET /api/v1/wishlist`

**Daftar Wishlist User**

_Melihat seluruh produk yang disimpan di wishlist._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201`: array of `WishlistItemResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `product_id` | string(uuid) | ✅ |  |
| `nama_produk` | string | ✅ |  |
| `price` | number | ✅ |  |
| `harga_asli` | number \| null | — |  |
| `foto_utama` | string \| null | — |  |
| `stok` | integer | ✅ |  |
| `rating` | number | ✅ |  |

---

### 🔒 `POST /api/v1/wishlist`

**Tambah ke Wishlist**

_Menambahkan produk ke wishlist._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`AddWishlistRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | string(uuid) | ✅ |  |


**Response** `200/201` (`WishlistItemResponse`):

_Lihat schema `WishlistItemResponse` di atas._

---

### 🔒 `POST /api/v1/wishlist/move-to-cart`

**Pindahkan Wishlist ke Keranjang**

_Memindahkan produk dari wishlist ke dalam keranjang belanja._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`MoveWishlistToCartRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | string(uuid) | ✅ |  |
| `quantity` | integer | — | default: `1` |


**Response** `200/201` (`CartResponse`):

_Lihat schema `CartResponse` di atas._

---

### 🔒 `DELETE /api/v1/wishlist/{product_id}`

**Hapus dari Wishlist**

_Menghapus produk dari wishlist._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `product_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

## Checkout

### 🔒 `GET /api/v1/checkout/shipping-rates`

**Cek Tarif Ongkir Kurir**

_Menghitung tarif ongkos kirim ke alamat pengguna._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `address_id` | query | string(uuid) | ✅ |  |
| `courier` | query | string | — | default: `all` |


**Response** `200/201`: array of `CourierOptionResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `courier_code` | string | ✅ |  |
| `courier_name` | string | ✅ |  |
| `service_code` | string | ✅ |  |
| `service_name` | string | ✅ |  |
| `price` | number | ✅ |  |
| `etd` | string | ✅ |  |

---

### 🔒 `POST /api/v1/checkout/preview`

**Kalkulasi Rincian Checkout**

_Melihat kalkulasi subtotal, diskon voucher, ongkir, dan total tagihan sebelum checkout._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`CheckoutPreviewRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address_id` | string(uuid) | ✅ |  |
| `courier_code` | string | ✅ |  |
| `service_code` | string | ✅ |  |
| `voucher_code` | string \| null | — |  |


**Response** `200/201` (`CheckoutPreviewResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subtotal` | number | ✅ |  |
| `shipping_cost` | number | ✅ |  |
| `discount_amount` | number | ✅ |  |
| `total_amount` | number | ✅ |  |
| `item_count` | integer | ✅ |  |
| `voucher_applied` | string \| null | — |  |

---

### 🔒 `POST /api/v1/checkout`

**Proses Buat Pesanan (Checkout)**

_Menyelesaikan pembelian, membuat link bayar Mayar, dan membuat pesanan resmi._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`CreateOrderRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `address_id` | string(uuid) | ✅ |  |
| `courier_code` | string | ✅ |  |
| `service_code` | string | ✅ |  |
| `voucher_code` | string \| null | — |  |
| `customer_notes` | string \| null | — |  |


**Response** `200/201` (`OrderResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `order_number` | string | ✅ |  |
| `status` | string | ✅ |  |
| `subtotal` | number | ✅ |  |
| `discount_amount` | number | ✅ |  |
| `shipping_cost` | number | ✅ |  |
| `total_amount` | number | ✅ |  |
| `shipping_recipient_name` | string | ✅ |  |
| `shipping_phone` | string | ✅ |  |
| `shipping_address` | string | ✅ |  |
| `shipping_city` | string | ✅ |  |
| `shipping_courier` | string | ✅ |  |
| `shipping_service` | string | ✅ |  |
| `items` | array\[`OrderItemResponse`\] | — |  |
| `payment` | `PaymentInfoResponse` \| null | — |  |
| `shipment` | `ShipmentInfoResponse` \| null | — |  |
| `created_at` | string(date-time) | ✅ |  |

---

## Orders

### 🔒 `GET /api/v1/orders`

**Riwayat Pesanan Pengguna**

_Melihat daftar seluruh pesanan yang pernah dibuat oleh user._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201`: array of `OrderResponse`

---

### 🔒 `GET /api/v1/orders/{order_id}`

**Detail Pesanan**

_Melihat status, payment link, tracking kurir, dan rincian belanja satu pesanan._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `order_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`OrderResponse`):

_Lihat schema `OrderResponse` di atas._

---

### 🔒 `POST /api/v1/orders/{order_id}/cancel`

**Batalkan Pesanan**

_Membatalkan pesanan yang belum dibayar (status pending) dan mengembalikan stok._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `order_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`OrderResponse`):

_Lihat schema `OrderResponse` di atas._

---

## Payments

### 🔒 `GET /api/v1/payments/order/{order_id}`

**Lihat Status Pembayaran Pesanan**

_Melihat status pembayaran dan tautan payment invoice Mayar._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `order_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`PaymentInfoResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `payment_method` | string | ✅ |  |
| `amount` | number | ✅ |  |
| `status` | string | ✅ |  |
| `mayar_payment_url` | string \| null | — |  |
| `paid_at` | string(date-time) \| null | — |  |

---

### 🌐 `POST /api/v1/payments/webhook`

**Webhook Callback dari Mayar Gateway**

_Menerima callback status pembayaran otomatis dari Mayar Payment Gateway. Wajib memvalidasi event & mengubah status order ke 'paid'._

---

## Shipping

### 🔒 `GET /api/v1/shipping/rates`

**Cek Tarif Ongkos Kirim**

_Menghitung tarif ongkos kirim ke alamat pengguna._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `address_id` | query | string(uuid) | ✅ |  |
| `courier` | query | string | — | default: `all` |


**Response** `200/201`: array of `CourierOptionResponse`

---

### 🔒 `GET /api/v1/shipping/track/{tracking_number}`

**Lacak Status Paket Kurir**

_Melacak status posisi pengiriman paket berdasarkan resi._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `tracking_number` | path | string | ✅ |  |

---

### 🌐 `POST /api/v1/shipping/webhook`

**Webhook Callback Status Pengiriman Biteship**

_Menerima live callback event status pengiriman dari Biteship._

---

## Promotions

### 🌐 `GET /api/v1/promotions/vouchers`

**Daftar Voucher Aktif**

_Melihat daftar seluruh voucher diskon yang sedang berlaku._


**Response** `200/201`: array of `app__promotions__schemas__VoucherResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `code` | string | ✅ |  |
| `name` | string | ✅ |  |
| `description` | string \| null | — |  |
| `discount_type` | string | ✅ |  |
| `discount_amount` | number | ✅ |  |
| `min_purchase` | number | ✅ |  |
| `max_discount` | number \| null | — |  |
| `usage_limit` | integer | ✅ |  |
| `used_count` | integer | ✅ |  |
| `start_date` | string(date-time) | ✅ |  |
| `end_date` | string(date-time) | ✅ |  |
| `is_active` | boolean | ✅ |  |

---

### 🌐 `POST /api/v1/promotions/validate`

**Validasi Kode Voucher**

_Cek keabsahan kode voucher dan hitung estimasi potongan harga diskon._


**Request Body** (`ValidateVoucherRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | ✅ |  |
| `subtotal` | number(min:0.0) | ✅ |  |


**Response** `200/201` (`ValidateVoucherResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `is_valid` | boolean | ✅ |  |
| `code` | string | ✅ |  |
| `discount_amount` | number | ✅ |  |
| `voucher` | `app__promotions__schemas__VoucherResponse` \| null | — |  |
| `message` | string | ✅ |  |

---

## Reviews

### 🔒 `POST /api/v1/reviews`

**Buat Ulasan Produk**

_Memberikan rating dan ulasan untuk item produk yang telah dibeli. Hanya produk dari pesanan berbayar/selesai yang dapat diulas._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`CreateReviewRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `order_item_id` | string(uuid) | ✅ |  |
| `rating` | integer(min:1.0, max:5.0) | ✅ | Rating dari 1 sampai 5 bintang |
| `comment` | string \| null | — |  |
| `photo_url` | string \| null | — |  |


**Response** `200/201` (`ReviewResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `product_id` | string(uuid) | ✅ |  |
| `user_id` | string(uuid) | ✅ |  |
| `user_name` | string \| null | — |  |
| `rating` | integer | ✅ |  |
| `comment` | string \| null | — |  |
| `photo_url` | string \| null | — |  |
| `created_at` | string(date-time) | ✅ |  |

---

### 🌐 `GET /api/v1/reviews/product/{product_id}`

**Lihat Ulasan Produk**

_Melihat seluruh ulasan, foto pembeli, dan nilai rata-rata rating suatu produk._


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `product_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`ProductReviewsSummaryResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `product_id` | string(uuid) | ✅ |  |
| `average_rating` | number | ✅ |  |
| `total_reviews` | integer | ✅ |  |
| `reviews` | array\[`ReviewResponse`\] | — |  |

---

### 🔒 `GET /api/v1/reviews/me`

**Daftar Ulasan Saya**

_Melihat seluruh riwayat ulasan yang pernah Anda buat._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201`: array of `ReviewResponse`

---

## Beauty Advisor

### 🔒 `POST /api/v1/beauty-advisor/chat`

**Konsultasi Produk dengan AI Beauty Advisor**

_Kirim pesan konsultasi kecantikan/skincare ke AI Beauty Advisor. Menerapkan alur: Input Guard -> Query Analyzer -> PostgreSQL Filter + pgvector RAG -> Recommendation Engine -> Qwen -> Output Guard. Bi..._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`ChatMessageRequest`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ | Pesan atau pertanyaan konsultasi dari pengguna |
| `conversation_id` | string(uuid) \| null | — | ID sesi percakapan sebelumnya (jika ingin melanjutkan sesi) |


**Response** `200/201` (`ChatResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversation_id` | string(uuid) | ✅ |  |
| `message_id` | string(uuid) | ✅ |  |
| `reply` | string | ✅ |  |
| `recommended_products` | array\[`RecommendedProductItem`\] | — |  |
| `suggested_followups` | array\[string\] | — |  |

---

### 🔒 `GET /api/v1/beauty-advisor/conversations`

**Daftar Sesi Konsultasi Pengguna**

_Melihat seluruh riwayat sesi konsultasi yang pernah dilakukan oleh user._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201`: array of `ConversationSummaryResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `title` | string | ✅ |  |
| `last_message` | string \| null | — |  |
| `created_at` | string(date-time) | ✅ |  |

---

### 🔒 `GET /api/v1/beauty-advisor/conversations/{conversation_id}`

**Detail Riwayat Konsultasi**

_Melihat percakapan lengkap dari satu sesi konsultasi AI._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `conversation_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`ConversationDetailResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `title` | string | ✅ |  |
| `created_at` | string(date-time) | ✅ |  |
| `messages` | array\[`MessageHistoryItem`\] | — |  |

---

### 🔒 `DELETE /api/v1/beauty-advisor/conversations/{conversation_id}`

**Hapus Sesi Konsultasi**

_Menghapus satu sesi percakapan dari riwayat konsultasi._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `conversation_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

## Admin

### 🔒 `GET /api/v1/admin/dashboard/stats`

**Statistik Lengkap Dashboard Admin**

_Mengambil ringkasan statistik toko: - Total penjualan (omset lunas) - Total order & rincian pesanan pending/selesai - Total customer & produk - Produk terlaris & produk stok menipis (< 10) - Order ter..._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201` (`DashboardStatsResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total_penjualan` | number | ✅ | Total nominal pendapatan dari pesanan yang dibayar |
| `total_order` | integer | ✅ | Jumlah total seluruh pesanan |
| `total_customer` | integer | ✅ | Jumlah seluruh pengguna terdaftar |
| `total_produk` | integer | ✅ | Jumlah total produk katalog |
| `pesanan_pending` | integer | ✅ | Pesanan menunggu pembayaran/proses |
| `pesanan_selesai` | integer | ✅ | Pesanan selesai |
| `top_selling_products` | array\[`TopSellingProduct`\] | — |  |
| `low_stock_products` | array\[`LowStockProduct`\] | — |  |
| `recent_orders` | array\[`RecentOrderSummary`\] | — |  |
| `sales_chart` | array\[`SalesChartDataPoint`\] | — |  |

---

### 🔒 `POST /api/v1/admin/products`

**Tambah Produk Baru**

_Admin membuat produk kosmetik/skincare baru ke katalog toko._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`AdminProductCreate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nama_produk` | string | ✅ |  |
| `brand_id` | string(uuid) \| null | — |  |
| `category_id` | string(uuid) \| null | — |  |
| `sub_category_id` | string(uuid) \| null | — |  |
| `harga` | number | ✅ |  |
| `harga_asli` | number \| null | — |  |
| `diskon_persen` | string \| null | — |  |
| `stok` | integer(min:0.0) | — | default: `0` |
| `foto_utama` | string \| null | — |  |
| `url_produk` | string \| null | — |  |
| `is_skincare` | boolean | — | default: `True` |
| `usage_time` | string \| null | — |  |
| `texture` | string \| null | — |  |
| `search_document` | string \| null | — |  |
| `skin_type_ids` | array\[string(uuid)\] | — |  |
| `skin_concern_ids` | array\[string(uuid)\] | — |  |
| `ingredient_ids` | array\[string(uuid)\] | — |  |
| `image_urls` | array\[string\] | — |  |


**Response** `200/201` (`ProductDetailResponse`):

_Lihat schema `ProductDetailResponse` di atas._

---

### 🔒 `PATCH /api/v1/admin/products/{product_id}`

**Update Data & Atribut Produk**

_Admin memperbarui harga, stok, deskripsi, foto, atau spesifikasi kecantikan produk._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `product_id` | path | string(uuid) | ✅ |  |


**Request Body** (`AdminProductUpdate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nama_produk` | string \| null | — |  |
| `brand_id` | string(uuid) \| null | — |  |
| `category_id` | string(uuid) \| null | — |  |
| `sub_category_id` | string(uuid) \| null | — |  |
| `harga` | number \| null | — |  |
| `harga_asli` | number \| null | — |  |
| `diskon_persen` | string \| null | — |  |
| `stok` | integer \| null | — |  |
| `foto_utama` | string \| null | — |  |
| `url_produk` | string \| null | — |  |
| `is_skincare` | boolean \| null | — |  |
| `usage_time` | string \| null | — |  |
| `texture` | string \| null | — |  |
| `search_document` | string \| null | — |  |
| `skin_type_ids` | array\[string(uuid)\] \| null | — |  |
| `skin_concern_ids` | array\[string(uuid)\] \| null | — |  |
| `ingredient_ids` | array\[string(uuid)\] \| null | — |  |
| `image_urls` | array\[string\] \| null | — |  |


**Response** `200/201` (`ProductDetailResponse`):

_Lihat schema `ProductDetailResponse` di atas._

---

### 🔒 `DELETE /api/v1/admin/products/{product_id}`

**Hapus Produk dari Katalog**

_Menghapus produk dari database katalog._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `product_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

### 🔒 `GET /api/v1/admin/orders`

**Daftar Seluruh Pesanan Toko**

_Melihat seluruh pesanan yang masuk ke toko beserta status pembayaran & pengiriman._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `status` | query | string \| null | — | Filter status: pending, paid, processing, shipped, delivered, completed, cancelled |
| `limit` | query | integer(min:1, max:100) | — | default: `50` |
| `offset` | query | integer(min:0) | — | default: `0` |


**Response** `200/201`: array of `OrderResponse`

---

### 🔒 `GET /api/v1/admin/orders/{order_id}`

**Detail Lengkap Pesanan**

_Melihat rincian satu pesanan: item belanja, snapshot alamat, log pembayaran, dan kurir._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `order_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`OrderResponse`):

_Lihat schema `OrderResponse` di atas._

---

### 🔒 `PATCH /api/v1/admin/orders/{order_id}/status`

**Ubah Status Pesanan**

_Mengubah status pesanan toko (misal memproses barang, membatalkan, atau menyelesaikan)._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `order_id` | path | string(uuid) | ✅ |  |


**Request Body** (`AdminOrderStatusUpdate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | ✅ | pending | paid | processing | shipped | delivered | completed | cancelled | refunded |
| `notes` | string \| null | — |  |


**Response** `200/201` (`OrderResponse`):

_Lihat schema `OrderResponse` di atas._

---

### 🔒 `POST /api/v1/admin/orders/{order_id}/tracking`

**Input Nomor Resi Kurir Pengiriman**

_Input nomor resi kurir pengiriman (JNE, SiCepat, J&T) dan otomatis mengubah status pesanan ke 'shipped'._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `order_id` | path | string(uuid) | ✅ |  |


**Request Body** (`AdminOrderTrackingInput`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `courier` | string | ✅ | Kode kurir: jne, sicepat, jnt |
| `tracking_number` | string | ✅ | Nomor resi pengiriman |


**Response** `200/201` (`OrderResponse`):

_Lihat schema `OrderResponse` di atas._

---

### 🔒 `GET /api/v1/admin/customers`

**Daftar Seluruh Pengguna (Pelanggan)**

_Melihat daftar seluruh pengguna dengan total transaksi dan nilai belanja (password tidak diekspos)._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `limit` | query | integer(min:1, max:100) | — | default: `50` |
| `offset` | query | integer(min:0) | — | default: `0` |


**Response** `200/201`: array of `CustomerListItem`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `email` | string | ✅ |  |
| `full_name` | string \| null | — |  |
| `phone` | string \| null | — |  |
| `email_verified` | boolean | ✅ |  |
| `is_active` | boolean | ✅ |  |
| `is_admin` | boolean | ✅ |  |
| `total_orders` | integer | — | default: `0` |
| `total_spend` | number | — | default: `0.0` |
| `created_at` | string(date-time) | ✅ |  |

---

### 🔒 `GET /api/v1/admin/customers/{user_id}`

**Detail Profil & Riwayat Belanja Customer**

_Melihat informasi profil pengguna, jumlah alamat tersimpan, dan riwayat seluruh pesanannya._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `user_id` | path | string(uuid) | ✅ |  |


**Response** `200/201` (`CustomerDetailResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `email` | string | ✅ |  |
| `email_verified` | boolean | ✅ |  |
| `is_active` | boolean | ✅ |  |
| `is_admin` | boolean | ✅ |  |
| `created_at` | string(date-time) | ✅ |  |
| `profile` | object \| null | — |  |
| `addresses_count` | integer | — | default: `0` |
| `orders` | array\[`RecentOrderSummary`\] | — |  |
| `total_spend` | number | — | default: `0.0` |

---

### 🔒 `PATCH /api/v1/admin/customers/{user_id}/status`

**Aktivasi/Nonaktifkan Akun Pengguna**

_Mengaktifkan/menonaktifkan akun customer atau memberikan hak akses Admin._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `user_id` | path | string(uuid) | ✅ |  |


**Request Body** (`CustomerStatusUpdate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `is_active` | boolean | ✅ |  |
| `is_admin` | boolean \| null | — |  |


**Response** `200/201` (`MessageResponse`):

_Lihat schema `MessageResponse` di atas._

---

### 🔒 `POST /api/v1/admin/categories`

**Tambah Kategori Baru**

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`AdminCategoryCreate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ |  |
| `description` | string \| null | — |  |


**Response** `200/201` (`CategoryResponse`):

_Lihat schema `CategoryResponse` di atas._

---

### 🔒 `POST /api/v1/admin/sub-categories`

**Tambah Sub-Kategori Baru**

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`AdminSubCategoryCreate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `category_id` | string(uuid) | ✅ |  |
| `name` | string | ✅ |  |

---

### 🔒 `POST /api/v1/admin/brands`

**Tambah Brand Baru**

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`AdminBrandCreate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ |  |
| `description` | string \| null | — |  |
| `logo_url` | string \| null | — |  |


**Response** `200/201` (`BrandResponse`):

_Lihat schema `BrandResponse` di atas._

---

### 🔒 `POST /api/v1/admin/skin-types`

**Tambah Master Skin Type**

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`AdminMasterDataCreate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ |  |
| `description` | string \| null | — |  |


**Response** `200/201` (`SkinTypeResponse`):

_Lihat schema `SkinTypeResponse` di atas._

---

### 🔒 `POST /api/v1/admin/skin-concerns`

**Tambah Master Skin Concern**

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`AdminMasterDataCreate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ |  |
| `description` | string \| null | — |  |


**Response** `200/201` (`SkinConcernResponse`):

_Lihat schema `SkinConcernResponse` di atas._

---

### 🔒 `POST /api/v1/admin/ingredients`

**Tambah Master Ingredient**

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`AdminMasterDataCreate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ |  |
| `description` | string \| null | — |  |


**Response** `200/201` (`IngredientResponse`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `name` | string | ✅ |  |
| `description` | string \| null | — |  |

---

### 🔒 `GET /api/v1/admin/promotions/vouchers`

**Daftar Seluruh Voucher Promosi**

_Melihat seluruh voucher toko, baik yang sedang aktif maupun non-aktif._

> 🔒 Membutuhkan JWT Bearer Token


**Response** `200/201`: array of `app__orders__schemas__VoucherResponse`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string(uuid) | ✅ |  |
| `code` | string | ✅ |  |
| `name` | string | ✅ |  |
| `discount_type` | string | ✅ |  |
| `discount_amount` | number | ✅ |  |
| `min_purchase` | number | ✅ |  |
| `max_discount` | number \| null | — |  |

---

### 🔒 `POST /api/v1/admin/promotions/vouchers`

**Buat Voucher Promosi Baru**

_Admin membuat kode promo / voucher diskon baru untuk kampanye marketing._

> 🔒 Membutuhkan JWT Bearer Token


**Request Body** (`AdminVoucherCreate`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `code` | string | ✅ |  |
| `name` | string | ✅ |  |
| `description` | string \| null | — |  |
| `discount_type` | string | ✅ | percentage | fixed |
| `discount_amount` | number | ✅ |  |
| `min_purchase` | number(min:0.0) | — | default: `0` |
| `max_discount` | number \| null | — |  |
| `start_date` | string(date-time) | ✅ |  |
| `end_date` | string(date-time) | ✅ |  |
| `usage_limit` | integer(min:1.0) | — | default: `100` |
| `is_active` | boolean | — | default: `True` |


**Response** `200/201` (`app__orders__schemas__VoucherResponse`):

_Lihat schema `app__orders__schemas__VoucherResponse` di atas._

---

### 🔒 `PATCH /api/v1/admin/promotions/vouchers/{voucher_id}/toggle`

**Aktifkan/Nonaktifkan Voucher**

_Mengubah status ketersediaan voucher promosi._

> 🔒 Membutuhkan JWT Bearer Token


**Query / Path Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `voucher_id` | path | string(uuid) | ✅ |  |
| `is_active` | query | boolean | ✅ | Status aktif voucher (true/false) |


**Response** `200/201` (`app__orders__schemas__VoucherResponse`):

_Lihat schema `app__orders__schemas__VoucherResponse` di atas._

---
