"""
limiter.py — Rate Limiter berbasis SlowAPI (In-Memory)
Membatasi laju request ke endpoint autentikasi & sensitif sesuai PRD & AGENTS.md
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Inisialisasi Limiter dengan storage in-memory (memory://)
# Sesuai opsi 1 tanpa membutuhkan container Redis eksternal
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["120/minute"],
    storage_uri="memory://",
)
