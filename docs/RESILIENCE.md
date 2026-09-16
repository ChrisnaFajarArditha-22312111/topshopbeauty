# 🛡️ Resilience & Ketahanan Sistem — Topshop Kosmetik AI

> **File:** `app/core/resilience.py` · `app/core/idempotency.py` · `app/core/limiter.py`
> **Test:** `backend/tests/test_resilience.py` — **4/4 Skenario Lulus ✅**

Dokumentasi ini menjelaskan empat pola ketahanan sistem yang diterapkan pada backend Topshop Kosmetik AI untuk memastikan stabilitas, keandalan, dan keamanan saat terjadi kegagalan pada layanan eksternal maupun lonjakan trafik.

---

## 📑 Daftar Isi

1. [Circuit Breaker](#1-circuit-breaker)
2. [Exponential Backoff Retry](#2-exponential-backoff-retry)
3. [Idempotency Key](#3-idempotency-key)
4. [Rate Limiting](#4-rate-limiting)
5. [Arsitektur Ringkas](#5-arsitektur-ringkas)

---

## 1. Circuit Breaker

**File:** [`app/core/resilience.py`](../backend/app/core/resilience.py)

### Deskripsi

Circuit Breaker mencegah sistem terus-menerus memanggil layanan eksternal yang sedang tidak stabil (misalnya Biteship, Mayar, atau Qwen). Saat kegagalan melebihi threshold, circuit "dibuka" sehingga semua request berikutnya langsung ditolak (*fast-fail*) atau diarahkan ke fungsi fallback — tanpa harus menunggu timeout.

### State Machine

| Transisi | Kondisi |
|----------|---------|
| `CLOSED` → `OPEN` | `failure_count >= failure_threshold` |
| `OPEN` → `HALF_OPEN` | `recovery_timeout` berlalu |
| `HALF_OPEN` → `CLOSED` | `success_count >= half_open_success_threshold` |
| `HALF_OPEN` → `OPEN` | Terjadi kegagalan saat uji coba |

### State Penjelasan

| State | Kondisi | Perilaku |
|-------|---------|----------|
| `CLOSED` | Normal | Request diteruskan ke layanan eksternal |
| `OPEN` | Terlalu banyak kegagalan | Request langsung fast-fail / diarahkan ke fallback |
| `HALF_OPEN` | Setelah recovery_timeout berlalu | Beberapa request percobaan diizinkan untuk menguji pemulihan |

### Konfigurasi Default per Layanan

| Layanan | `failure_threshold` | `recovery_timeout` | `half_open_success_threshold` |
|---------|---------------------|--------------------|-------------------------------|
| `biteship` | 4 kegagalan | 20 detik | 2 sukses |
| `mayar` | 4 kegagalan | 20 detik | 2 sukses |
| `qwen` | 3 kegagalan | 25 detik | 2 sukses |

### Cara Penggunaan

**Metode 1 — Panggil langsung via `cb.call()`:**

```python
from app.core.resilience import biteship_breaker

async def get_shipping_rates(payload):
    return await biteship_breaker.call(
        biteship_api_client.get_rates,
        payload,
        fallback=lambda: {"rates": [], "message": "Layanan ongkir sementara tidak tersedia"},
    )
```

**Metode 2 — Gunakan sebagai decorator `@cb.protect()`:**

```python
from app.core.resilience import qwen_breaker

@qwen_breaker.protect(fallback=lambda: "Maaf, AI sedang tidak tersedia. Silakan coba lagi.")
async def call_qwen_llm(prompt: str) -> str:
    return await qwen_client.chat(prompt)
```

### Perilaku Fast-Fail

Saat circuit `OPEN`, request baru akan ditolak secara instan (latensi < 1ms) tanpa menunggu timeout dari layanan eksternal:

```
⚡ CircuitBreaker 'biteship' OPEN! Fast-failing request (18.5s tersisa)
```

Jika fallback disediakan, hasilnya dikembalikan langsung. Jika tidak ada fallback, `CircuitBreakerOpenError` dilempar.

### Exception

```python
from app.core.resilience import CircuitBreakerOpenError

try:
    result = await biteship_breaker.call(some_func)
except CircuitBreakerOpenError as e:
    # e.breaker_name            → "biteship"
    # e.recovery_seconds_left   → sisa waktu pemulihan (detik)
    raise HTTPException(503, detail=str(e))
```

---

## 2. Exponential Backoff Retry

**File:** [`app/core/resilience.py`](../backend/app/core/resilience.py) — fungsi `retry_with_backoff()`

### Deskripsi

Retry otomatis dengan jeda waktu yang tumbuh secara eksponensial (ditambah jitter acak) untuk menangani kegagalan transient seperti timeout jaringan atau koneksi terputus sementara.

### Formula Delay

```
delay = (base_delay × backoff_factor^attempt) + random.uniform(0.05, 0.15)
```

Contoh dengan `base_delay=0.3`, `backoff_factor=2.0`:

| Percobaan | Delay dasar | Delay dengan jitter |
|-----------|-------------|---------------------|
| Ke-1 gagal | 0.30s | ~0.37–0.45s |
| Ke-2 gagal | 0.60s | ~0.65–0.75s |
| Ke-3 gagal | Error dilempar | — |

### Parameter

| Parameter | Default | Keterangan |
|-----------|---------|------------|
| `max_retries` | `2` | Jumlah percobaan ulang (total = max_retries + 1) |
| `base_delay` | `0.3` detik | Delay awal sebelum percobaan ulang pertama |
| `backoff_factor` | `2.0` | Pengali eksponensial tiap retry |
| `retryable_exceptions` | `httpx.RequestError`, `httpx.TimeoutException` | Exception yang memicu retry |

### Cara Penggunaan

```python
from app.core.resilience import retry_with_backoff

async def fetch_courier_list():
    return await retry_with_backoff(
        biteship_client.get_couriers,
        max_retries=3,
        base_delay=0.5,
        backoff_factor=2.0,
    )
```

### Integrasi dengan Circuit Breaker

Retry dan Circuit Breaker saling melengkapi:

```python
async def call_external_with_full_resilience(payload):
    async def _inner():
        return await retry_with_backoff(
            external_api.call,
            payload,
            max_retries=2,
        )
    return await biteship_breaker.call(
        _inner,
        fallback=lambda: {"error": "Service unavailable"},
    )
```

---

## 3. Idempotency Key

**File:** [`app/core/idempotency.py`](../backend/app/core/idempotency.py)

### Deskripsi

Idempotency Key memastikan operasi sensitif seperti **checkout** dan **pembayaran** tidak dieksekusi dua kali — bahkan jika client mengirim request ulang akibat timeout, double-click, atau retry otomatis.

### Tabel Database

**Tabel:** `idempotency_keys`

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID | Primary key |
| `key` | VARCHAR(128) | Idempotency key dari header client (unique, indexed) |
| `user_id` | UUID | ID user pemilik request (nullable) |
| `request_path` | VARCHAR(255) | Endpoint yang dipanggil |
| `request_hash` | VARCHAR(64) | SHA-256 hash dari payload request |
| `status` | VARCHAR(20) | `processing` \| `completed` \| `failed` |
| `response_code` | INT | HTTP status code dari respon asli |
| `response_body` | TEXT | JSON body dari respon asli |
| `created_at` | TIMESTAMPTZ | Waktu record dibuat |
| `expires_at` | TIMESTAMPTZ | Waktu record kedaluwarsa (default: +24 jam) |

### Aturan Keamanan

| Skenario | Respon |
|----------|--------|
| Request pertama (key baru) | Cache MISS → eksekusi normal |
| Request ulang (key sama, payload sama, status `completed`) | **Cache HIT** → kembalikan respon tersimpan |
| Request konkuren (key sama, status `processing`) | **HTTP 409 Conflict** |
| Request ulang (key sama, payload **berbeda**) | **HTTP 422 Unprocessable Entity** |
| Retry setelah kegagalan (status `failed`) | Diizinkan — status direset ke `processing` |
| Key kedaluwarsa (melebihi TTL 24 jam) | Record dihapus → eksekusi seperti request baru |

### Lifecycle Alur

```
Request dengan Idempotency-Key
        ↓
  Record ada di DB?
     ├─ Tidak → Buat record "processing" → Eksekusi
     │              ├─ Sukses → complete_idempotency() → "completed"
     │              └─ Error  → fail_idempotency()    → "failed"
     │
     ├─ Ya, status "completed":
     │     ├─ Hash sama    → Cache HIT ✅ (return respon tersimpan)
     │     └─ Hash beda   → HTTP 422 ⛔
     │
     ├─ Ya, status "processing" → HTTP 409 🔒
     │
     ├─ Ya, status "failed"     → Reset ke "processing", izinkan retry 🔄
     │
     └─ Ya, sudah expired       → Hapus, lanjut seperti request baru
```

### Cara Penggunaan di Endpoint

```python
from fastapi import Header
from app.core.idempotency import (
    check_or_start_idempotency,
    complete_idempotency,
    fail_idempotency,
)

@router.post("/checkout", status_code=201)
async def checkout(
    request_data: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
):
    if idempotency_key:
        is_hit, code, cached = await check_or_start_idempotency(
            db=db,
            key=idempotency_key,
            request_path="/api/v1/checkout",
            payload=request_data,
            user_id=uuid.UUID(current_user["sub"]),
        )
        if is_hit:
            return JSONResponse(status_code=code, content=cached)

    try:
        result = await checkout_service.process(db, request_data, current_user)
        if idempotency_key:
            await complete_idempotency(db, idempotency_key, 201, result)
        return result
    except Exception as e:
        if idempotency_key:
            await fail_idempotency(db, idempotency_key)
        raise
```

### Penggunaan dari Client (HTTP Header)

```http
POST /api/v1/checkout
Authorization: Bearer <token>
Idempotency-Key: checkout-user123-20260912-abc123
Content-Type: application/json

{
  "address_id": "...",
  "items": [...]
}
```

> **Catatan:** `Idempotency-Key` bersifat opsional. Endpoint tetap berfungsi tanpa header ini, namun tidak mendapatkan proteksi double-submission.

---

## 4. Rate Limiting

**File:** [`app/core/limiter.py`](../backend/app/core/limiter.py)

### Deskripsi

Rate Limiting menggunakan **SlowAPI** dengan penyimpanan **in-memory** untuk membatasi jumlah request per IP per satuan waktu. Melindungi endpoint autentikasi dan sensitif dari serangan brute-force, credential stuffing, dan abuse.

### Konfigurasi Global

```python
# app/core/limiter.py
limiter = Limiter(
    key_func=get_remote_address,   # Identifikasi berdasarkan IP client
    default_limits=["120/minute"], # Default: 120 req/menit untuk semua endpoint
    storage_uri="memory://",       # In-memory (tidak butuh Redis)
)
```

### Limit per Endpoint Auth

| Endpoint | Limit | Keterangan |
|----------|-------|------------|
| `POST /api/v1/auth/register` | **10/menit** | Cegah pembuatan akun massal |
| `POST /api/v1/auth/verify-email` | **10/menit** | Cegah brute-force OTP |
| `POST /api/v1/auth/resend-verification` | **5/menit** | Cegah spam email OTP |
| `POST /api/v1/auth/login` | **15/menit** | Cegah brute-force password |
| `POST /api/v1/auth/forgot-password` | **5/menit** | Cegah spam email reset |
| `POST /api/v1/auth/reset-password` | **5/menit** | Cegah brute-force token reset |
| Semua endpoint lainnya | **120/menit** | Default global |

### Respon saat Limit Terlampaui

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Rate limit exceeded: 10 per 1 minute"
}
```

### Integrasi di `main.py`

```python
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.core.limiter import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

### Penggunaan di Router

```python
from app.core.limiter import limiter

@router.post("/register")
@limiter.limit("10/minute")
async def register(request: Request, data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Parameter `request: Request` WAJIB ada agar SlowAPI bisa membaca IP client
    ...
```

> ⚠️ Parameter `request: Request` **wajib** ada sebagai parameter fungsi endpoint agar SlowAPI dapat membaca IP client.

---

## 5. Arsitektur Ringkas

### Lapisan Perlindungan (Urutan Eksekusi)

```
Request Masuk
    ↓
[1] Rate Limiter          → Tolak jika IP melebihi kuota → HTTP 429
    ↓
[2] Auth Middleware        → Validasi JWT (endpoint yang membutuhkan auth)
    ↓
[3] Idempotency Check     → Cache HIT / Tolak duplikat → HTTP 409 / 422
    ↓
[4] Business Logic        → Proses order, payment, AI, dll.
    ↓
[5] Exponential Backoff   → Ulangi jika error transient (timeout/koneksi)
    ↓
[6] Circuit Breaker       → Proteksi panggilan ke layanan eksternal
    ↓
[7] complete_idempotency  → Simpan respon ke cache idempotency
    ↓
Response ke Client
```

### Layanan Eksternal yang Dilindungi

| Layanan | Circuit Breaker | Retry |
|---------|----------------|-------|
| **Biteship** (ongkir & tracking) | `biteship_breaker` | ✅ `retry_with_backoff` |
| **Mayar** (payment gateway) | `mayar_breaker` | ✅ `retry_with_backoff` |
| **Qwen / AI** (beauty advisor) | `qwen_breaker` | ✅ `retry_with_backoff` |

---

## 📦 Dependencies

```txt
# requirements.txt
slowapi==0.1.9      # Rate limiting
limits==3.6.0       # Backend storage untuk SlowAPI
httpx==0.27.0       # HTTP client (digunakan di retry exception types)
sqlalchemy[asyncio] # ORM untuk idempotency key table
aiosqlite           # (testing only) SQLite in-memory untuk unit test
```

---

## 🧪 Test Suite

**File:** [`backend/tests/test_resilience.py`](../backend/tests/test_resilience.py)

Jalankan:

```bash
cd backend
source venv/bin/activate
python tests/test_resilience.py
```

Hasil:

| # | Skenario | Hasil |
|---|----------|-------|
| 1 | **Circuit Breaker** — CLOSED→OPEN (3 gagal), fast-fail < 1ms, fallback, OPEN→HALF_OPEN (timeout), HALF_OPEN→CLOSED (2 trial sukses) | ✅ Lulus |
| 2 | **Exponential Backoff Retry** — Pulih di percobaan ke-3, maks retry ditaati (3 total attempts) | ✅ Lulus |
| 3 | **Idempotency Key** — Cache miss, Race condition 409, Simpan completed, Cache hit, Payload mismatch 422, Retry setelah fail | ✅ Lulus |
| 4 | **Rate Limiting** — HTTP 429 dipicu setelah 10 request/menit dari IP yang sama | ✅ Lulus |

---

*Terakhir diperbarui: 2026-09-12 oleh Claude Sonnet 4.6 (Antigravity)*
