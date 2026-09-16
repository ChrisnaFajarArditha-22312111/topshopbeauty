"""
test_resilience.py — Test Suite untuk Fitur Ketahanan Sistem
1. Circuit Breaker (CLOSED -> OPEN -> HALF_OPEN -> CLOSED) & Fast-fail
2. Exponential Backoff Retry dengan Jitter
3. Idempotency Key (Cache hit, Concurrency conflict 409, Payload mismatch 422, Retry on failure)
4. SlowAPI Rate Limiting (HTTP 429 Too Many Requests)
"""
import asyncio
import os
import sys
import time
import uuid
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

# Ensure backend root is in sys.path
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import HTTPException, status
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.core.idempotency import (
    IdempotencyKeyRecord,
    check_or_start_idempotency,
    complete_idempotency,
    fail_idempotency,
    compute_request_hash,
)
from app.core.resilience import (
    CircuitBreaker,
    CircuitState,
    CircuitBreakerOpenError,
    retry_with_backoff,
)
from app.main import app

# Colors
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_header(title):
    print(f"\n{CYAN}{BOLD}{'='*60}{RESET}")
    print(f"{CYAN}{BOLD}  {title}{RESET}")
    print(f"{CYAN}{BOLD}{'='*60}{RESET}")


def print_ok(msg):
    print(f"  {GREEN}✓ {msg}{RESET}")


def print_fail(msg):
    print(f"  {RED}✗ {msg}{RESET}")


# =========================================================
# SKENARIO 1: Circuit Breaker State Machine & Fast Fail
# =========================================================
async def test_circuit_breaker():
    print_header("SKENARIO 1: Circuit Breaker State Machine & Fast Fail")

    cb = CircuitBreaker(
        name="test_service",
        failure_threshold=3,
        recovery_timeout=0.5,  # 500ms untuk kecepatan test
        half_open_success_threshold=2,
    )

    # 1. State awal harus CLOSED
    assert cb.state == CircuitState.CLOSED
    print_ok("State awal Circuit Breaker terverifikasi CLOSED")

    async def faulty_service():
        raise RuntimeError("External service connection timeout")

    async def healthy_service():
        return {"status": "ok", "data": "success"}

    # 2. Trigger failures sampai threshold tercapai (3x)
    for i in range(3):
        try:
            await cb.call(faulty_service)
        except RuntimeError:
            pass

    assert cb.state == CircuitState.OPEN
    print_ok("Circuit Breaker berhasil trip menjadi OPEN setelah 3x kegagalan berturut-turut")

    # 3. Fast fail: Request saat OPEN langsung ditolak tanpa menunggu
    start_t = time.monotonic()
    try:
        await cb.call(faulty_service)
        assert False, "Harusnya melempar CircuitBreakerOpenError"
    except CircuitBreakerOpenError as e:
        elapsed = time.monotonic() - start_t
        assert elapsed < 0.05, "Fast-fail harus merespon instan"
        print_ok(f"Fast-fail aktif: {e.args[0][:55]}... (Latency: {elapsed*1000:.2f}ms)")

    # 4. Fallback saat OPEN
    fallback_res = await cb.call(faulty_service, fallback=lambda: {"fallback": True})
    assert fallback_res == {"fallback": True}
    print_ok("Graceful fallback terpanggil saat status OPEN")

    # 5. Menunggu recovery_timeout (500ms) untuk masuk ke HALF_OPEN
    await asyncio.sleep(0.55)
    allowed, _ = cb.can_execute()
    assert allowed is True
    assert cb.state == CircuitState.HALF_OPEN
    print_ok("Circuit Breaker berhasil bertransisi OPEN -> HALF_OPEN setelah timeout")

    # 6. Pemulihan: Trial pertama sukses
    res1 = await cb.call(healthy_service)
    assert res1["status"] == "ok"
    assert cb.state == CircuitState.HALF_OPEN
    print_ok("Trial 1 pada HALF_OPEN sukses (masih menguji stabilitas)")

    # Trial kedua sukses -> harus kembali ke CLOSED
    res2 = await cb.call(healthy_service)
    assert res2["status"] == "ok"
    assert cb.state == CircuitState.CLOSED
    assert cb.failure_count == 0
    print_ok("Trial 2 sukses: Circuit Breaker sepenuhnya pulih kembali ke CLOSED!")


# =========================================================
# SKENARIO 2: Exponential Backoff Retry dengan Jitter
# =========================================================
async def test_retry_with_backoff():
    print_header("SKENARIO 2: Exponential Backoff Retry")

    attempts = 0

    async def flaky_api():
        nonlocal attempts
        attempts += 1
        if attempts < 3:
            import httpx
            raise httpx.RequestError(f"Temporary glitch on attempt {attempts}")
        return "success_recovered"

    start_time = time.monotonic()
    result = await retry_with_backoff(
        flaky_api,
        max_retries=3,
        base_delay=0.1,
        backoff_factor=1.5,
    )
    elapsed = time.monotonic() - start_time

    assert result == "success_recovered"
    assert attempts == 3
    print_ok(f"Retry berhasil pulih pada percobaan ke-{attempts} (Total waktu: {elapsed:.2f}s)")

    # Test jika gagal melebihi max_retries
    fail_attempts = 0

    async def dead_api():
        nonlocal fail_attempts
        fail_attempts += 1
        import httpx
        raise httpx.ConnectTimeout("Server dead")

    try:
        await retry_with_backoff(
            dead_api,
            max_retries=2,
            base_delay=0.05,
        )
        assert False, "Harusnya raise exception"
    except Exception as exc:
        assert fail_attempts == 3  # 1 initial + 2 retries
        print_ok(f"Maksimal retry ditaati: berhenti setelah {fail_attempts} kali percobaan")


# =========================================================
# SKENARIO 3: PostgreSQL Idempotency Key
# =========================================================
async def test_idempotency_key():
    print_header("SKENARIO 3: PostgreSQL Idempotency Key Lifecycle")

    # In-memory SQLite engine untuk pengujian
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    TestSession = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)

    async with TestSession() as db:
        test_key = f"idem_test_{uuid.uuid4().hex}"
        test_user_id = uuid.uuid4()
        payload = {"items": [{"product_id": 1, "quantity": 2}], "address_id": "addr-123"}
        request_path = "/api/v1/checkout"

        # 1. Request pertama (Cache MISS)
        is_hit, code, cached = await check_or_start_idempotency(
            db=db,
            key=test_key,
            request_path=request_path,
            payload=payload,
            user_id=test_user_id,
        )
        assert is_hit is False
        assert code is None
        assert cached is None
        print_ok("Request 1: Cache MISS terdeteksi, record 'processing' berhasil dibuat")

        # 2. Request kedua saat masih processing (Concurrency Conflict -> 409)
        try:
            await check_or_start_idempotency(
                db=db,
                key=test_key,
                request_path=request_path,
                payload=payload,
                user_id=test_user_id,
            )
            assert False, "Harusnya melempar HTTP 409 Conflict"
        except HTTPException as exc:
            assert exc.status_code == status.HTTP_409_CONFLICT
            print_ok("Proteksi Race Condition: Request konkuren ditolak dengan HTTP 409 Conflict")

        # 3. Selesaikan request pertama (Save completed response)
        mock_response = {
            "order_number": "ORD-20260912-8888",
            "total_amount": 150000.0,
            "status": "pending",
        }
        await complete_idempotency(db, test_key, response_code=200, response_data=mock_response)
        print_ok("Request 1 selesai: Respon berhasil dicatat sebagai status 'completed'")

        # 4. Request ketiga dengan key yang sama & payload sama (Cache HIT)
        is_hit_2, code_2, cached_2 = await check_or_start_idempotency(
            db=db,
            key=test_key,
            request_path=request_path,
            payload=payload,
            user_id=test_user_id,
        )
        assert is_hit_2 is True
        assert code_2 == 200
        assert cached_2["order_number"] == "ORD-20260912-8888"
        print_ok(f"Request 2 (Replay): Cache HIT! Respon tersimpan dikembalikan langsung ({cached_2['order_number']})")

        # 5. Request keempat dengan key sama tetapi payload BERBEDA (Payload Mismatch -> 422)
        different_payload = {"items": [{"product_id": 99, "quantity": 10}]}
        try:
            await check_or_start_idempotency(
                db=db,
                key=test_key,
                request_path=request_path,
                payload=different_payload,
                user_id=test_user_id,
            )
            assert False, "Harusnya melempar HTTP 422 Unprocessable Entity"
        except HTTPException as exc:
            assert exc.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
            print_ok("Keamanan Payload: Penggunaan ulang key dengan body berbeda ditolak (HTTP 422)")

        # 6. Retry setelah failure
        fail_key = f"idem_fail_{uuid.uuid4().hex}"
        await check_or_start_idempotency(db, fail_key, "/api/v1/checkout", payload)
        await fail_idempotency(db, fail_key)

        is_retry_hit, _, _ = await check_or_start_idempotency(db, fail_key, "/api/v1/checkout", payload)
        assert is_retry_hit is False
        print_ok("Recovery: Transaksi yang sebelumnya berstatus failed diizinkan untuk diulang")


# =========================================================
# SKENARIO 4: SlowAPI Rate Limiter
# =========================================================
async def test_rate_limiter():
    print_header("SKENARIO 4: SlowAPI In-Memory Rate Limiting")

    # Mock semua dependensi eksternal agar test berjalan tanpa PostgreSQL/SMTP
    mock_db = AsyncMock()

    async def override_get_db():
        yield mock_db

    from app.core import database as db_module
    from app.auth import service as auth_service

    with (
        patch.object(db_module, "init_db", new=AsyncMock()),
        patch.object(db_module, "close_db", new=AsyncMock()),
        patch.object(auth_service, "register_user", new=AsyncMock(return_value=None)),
    ):
        app.dependency_overrides[db_module.get_db] = override_get_db

        try:
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                # Endpoint /api/v1/auth/register dibatasi 10 request per menit
                # Kirim 12 request cepat berturut-turut dari IP yang sama
                hit_429 = False
                statuses = []

                for i in range(12):
                    resp = await client.post(
                        "/api/v1/auth/register",
                        json={
                            "full_name": f"User Test {i}",
                            "email": f"ratelimit_{i}_{uuid.uuid4().hex[:6]}@example.com",
                            "password": "ValidPassword123!",
                            "confirm_password": "ValidPassword123!",
                        },
                        headers={"X-Forwarded-For": "192.168.100.50"},
                    )
                    statuses.append(resp.status_code)
                    if resp.status_code == 429:
                        hit_429 = True
                        break

                assert hit_429 is True, f"Harus memicu HTTP 429 Too Many Requests. Statuses: {statuses}"
                print_ok("Rate Limiter aktif: Request berlebih berhasil ditahan dengan HTTP 429 Too Many Requests")
        finally:
            app.dependency_overrides.clear()


# =========================================================
# RUNNER
# =========================================================
def run_all():
    print(f"\n{BOLD}{CYAN}{'#'*60}{RESET}")
    print(f"{BOLD}{CYAN}  SYSTEM RESILIENCE & IDEMPOTENCY TEST SUITE{RESET}")
    print(f"{BOLD}{CYAN}  Topshop Kosmetik AI{RESET}")
    print(f"{BOLD}{CYAN}{'#'*60}{RESET}")

    asyncio.run(test_circuit_breaker())
    asyncio.run(test_retry_with_backoff())
    asyncio.run(test_idempotency_key())
    asyncio.run(test_rate_limiter())

    print(f"\n{BOLD}{GREEN}{'='*60}{RESET}")
    print(f"{BOLD}{GREEN}  HASIL AKHIR: 4/4 SKENARIO RESILIENCE LULUS SEMPURNA! 🎉{RESET}")
    print(f"{BOLD}{GREEN}  Circuit Breaker, Exponential Retry, Idempotency, dan Rate Limiter OK!{RESET}")
    print(f"{BOLD}{GREEN}{'='*60}{RESET}\n")


if __name__ == "__main__":
    run_all()
