"""
resilience.py — Modul Ketahanan Sistem (Circuit Breaker & Exponential Backoff Retry)
Menangani kegagalan transient pada panggilan external API (Biteship, Mayar, Qwen).

Pola yang diimplementasikan:
1. Circuit Breaker Pattern:
   - CLOSED: Kondisi normal, request diteruskan ke provider eksternal.
   - OPEN: Terjadi kegagalan berturut-turut melebihi threshold, request langsung ditolak / dialihkan ke fallback instan.
   - HALF_OPEN: Setelah recovery_timeout lewat, uji coba 1-2 request untuk memastikan layanan sudah pulih.
2. Exponential Backoff Retry:
   - Pengulangan otomatis untuk error sementara (timeout/koneksi terputus) dengan jitter acak.
"""
import asyncio
import inspect
import logging
import random
import time
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Tuple, Type, Union

import httpx
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


class CircuitState(str, Enum):
    CLOSED = "CLOSED"
    OPEN = "OPEN"
    HALF_OPEN = "HALF_OPEN"


class CircuitBreakerOpenError(Exception):
    """Exception yang dilempar saat circuit breaker berstatus OPEN dan tidak ada fallback."""
    def __init__(self, breaker_name: str, recovery_seconds_left: float):
        self.breaker_name = breaker_name
        self.recovery_seconds_left = recovery_seconds_left
        super().__init__(
            f"Circuit Breaker '{breaker_name}' is OPEN. "
            f"Layanan eksternal sedang tidak stabil. Coba kembali dalam {recovery_seconds_left:.1f} detik."
        )


class CircuitBreaker:
    """
    In-memory Circuit Breaker state machine per proses worker.
    """
    def __init__(
        self,
        name: str,
        failure_threshold: int = 4,
        recovery_timeout: float = 25.0,
        half_open_success_threshold: int = 2,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_success_threshold = half_open_success_threshold

        self.state: CircuitState = CircuitState.CLOSED
        self.failure_count: int = 0
        self.success_count: int = 0
        self.last_failure_time: float = 0.0
        self.last_state_change: float = time.monotonic()

    def can_execute(self) -> Tuple[bool, float]:
        """
        Cek apakah request diizinkan dieksekusi.
        Mengembalikan (allowed: bool, seconds_left: float).
        """
        now = time.monotonic()
        if self.state == CircuitState.CLOSED:
            return True, 0.0

        if self.state == CircuitState.OPEN:
            elapsed = now - self.last_failure_time
            if elapsed >= self.recovery_timeout:
                logger.info(
                    f"🔄 CircuitBreaker '{self.name}' beralih dari OPEN -> HALF_OPEN (mencoba pemulihan)"
                )
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
                self.last_state_change = now
                return True, 0.0
            else:
                return False, self.recovery_timeout - elapsed

        # State HALF_OPEN
        return True, 0.0

    def record_success(self):
        """Mencatat keberhasilan pemanggilan eksternal."""
        now = time.monotonic()
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            logger.info(
                f"📈 CircuitBreaker '{self.name}' HALF_OPEN trial sukses "
                f"({self.success_count}/{self.half_open_success_threshold})"
            )
            if self.success_count >= self.half_open_success_threshold:
                logger.info(f"✅ CircuitBreaker '{self.name}' pulih! Beralih HALF_OPEN -> CLOSED")
                self.state = CircuitState.CLOSED
                self.failure_count = 0
                self.success_count = 0
                self.last_state_change = now
        elif self.state == CircuitState.CLOSED:
            self.failure_count = 0

    def record_failure(self, error: Optional[Exception] = None):
        """Mencatat kegagalan pemanggilan eksternal."""
        now = time.monotonic()
        self.last_failure_time = now
        self.failure_count += 1
        logger.warning(
            f"⚠️ CircuitBreaker '{self.name}' mencatat kegagalan #{self.failure_count} (error: {error})"
        )

        if self.state == CircuitState.HALF_OPEN:
            logger.warning(f"🚨 CircuitBreaker '{self.name}' gagal saat uji coba! Kembali ke OPEN")
            self.state = CircuitState.OPEN
            self.last_state_change = now
        elif self.state == CircuitState.CLOSED:
            if self.failure_count >= self.failure_threshold:
                logger.error(
                    f"💥 CircuitBreaker '{self.name}' mencapai batas kegagalan ({self.failure_count}/{self.failure_threshold})! "
                    f"Status berubah ke OPEN selama {self.recovery_timeout} detik."
                )
                self.state = CircuitState.OPEN
                self.last_state_change = now

    async def call(
        self,
        func: Callable,
        *args,
        fallback: Optional[Callable] = None,
        **kwargs,
    ) -> Any:
        """
        Mengeksekusi fungsi async dengan perlindungan Circuit Breaker.
        Jika sirkuit OPEN dan fallback disediakan, langsung kembalikan hasil fallback.
        """
        allowed, seconds_left = self.can_execute()
        if not allowed:
            logger.warning(
                f"⚡ CircuitBreaker '{self.name}' OPEN! Fast-failing request ({seconds_left:.1f}s tersisa)"
            )
            if fallback is not None:
                if inspect.iscoroutinefunction(fallback):
                    return await fallback(*args, **kwargs)
                return fallback(*args, **kwargs)
            raise CircuitBreakerOpenError(self.name, seconds_left)

        try:
            if inspect.iscoroutinefunction(func):
                result = await func(*args, **kwargs)
            else:
                result = func(*args, **kwargs)
            self.record_success()
            return result
        except Exception as e:
            self.record_failure(e)
            if fallback is not None:
                logger.info(f"🛡️ Mengaktifkan fallback function untuk '{self.name}' setelah error")
                if inspect.iscoroutinefunction(fallback):
                    return await fallback(*args, **kwargs)
                return fallback(*args, **kwargs)
            raise

    def protect(self, fallback: Optional[Callable] = None):
        """Decorator untuk melindungi fungsi coroutine dengan Circuit Breaker."""
        def decorator(func: Callable):
            async def wrapper(*args, **kwargs):
                return await self.call(func, *args, fallback=fallback, **kwargs)
            return wrapper
        return decorator


async def retry_with_backoff(
    func: Callable,
    *args,
    max_retries: int = 2,
    base_delay: float = 0.3,
    backoff_factor: float = 2.0,
    retryable_exceptions: Tuple[Type[Exception], ...] = (
        httpx.RequestError,
        httpx.TimeoutException,
    ),
    **kwargs,
) -> Any:
    """
    Menjalankan fungsi coroutine dengan pengulangan eksponensial (Exponential Backoff) dan Jitter acak.
    """
    for attempt in range(max_retries + 1):
        try:
            if inspect.iscoroutinefunction(func):
                return await func(*args, **kwargs)
            return func(*args, **kwargs)
        except retryable_exceptions as exc:
            if attempt == max_retries:
                logger.error(
                    f"❌ Percobaan ke-{attempt + 1} gagal total. Melempar error: {exc}"
                )
                raise exc

            jitter = random.uniform(0.05, 0.15)
            delay = (base_delay * (backoff_factor ** attempt)) + jitter
            logger.warning(
                f"🔁 Percobaan ke-{attempt + 1} gagal ({exc}). Mengulang dalam {delay:.2f} detik..."
            )
            await asyncio.sleep(delay)


# =========================================================
# Instansiasi Circuit Breaker Global per Layanan Eksternal
# =========================================================
biteship_breaker = CircuitBreaker(
    name="biteship",
    failure_threshold=4,
    recovery_timeout=20.0,
    half_open_success_threshold=2,
)

mayar_breaker = CircuitBreaker(
    name="mayar",
    failure_threshold=4,
    recovery_timeout=20.0,
    half_open_success_threshold=2,
)

qwen_breaker = CircuitBreaker(
    name="qwen",
    failure_threshold=3,
    recovery_timeout=25.0,
    half_open_success_threshold=2,
)
