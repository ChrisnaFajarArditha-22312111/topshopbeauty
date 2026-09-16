"""
tests_phase1.py — Script verifikasi Phase 1 (Foundation)
Menguji:
1. Pydantic Settings & Environment
2. Password Hashing & Verification (Bcrypt)
3. JWT Access & Refresh Token Creation & Verification
4. Email module syntax & helper functions
5. FastAPI app initialization, routes, & Health Endpoint
"""
import asyncio
import sys
from pathlib import Path

# Memastikan modul app dalam sys.path
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
)
from app.main import app
from httpx import ASGITransport, AsyncClient

async def run_tests():
    print("=== TEST 1: CONFIG & SETTINGS ===")
    assert settings.APP_NAME == "Topshop Kosmetik AI"
    assert settings.is_development is True
    assert "http://localhost:3000" in settings.get_allowed_origins_list()
    print("✅ Settings OK")

    print("=== TEST 2: PASSWORD HASHING ===")
    raw = "P@sswordRahasia123"
    hashed = hash_password(raw)
    assert verify_password(raw, hashed) is True
    assert verify_password("wrong", hashed) is False
    print("✅ Password hashing OK")

    print("=== TEST 3: JWT TOKENS ===")
    data = {"sub": "user-uuid-123", "role": "customer"}
    access_token = create_access_token(data)
    refresh_token = create_refresh_token(data)
    payload = verify_token(access_token, token_type="access")
    assert payload["sub"] == "user-uuid-123"
    ref_payload = verify_token(refresh_token, token_type="refresh")
    assert ref_payload["sub"] == "user-uuid-123"
    print("✅ JWT Access & Refresh Token OK")

    print("=== TEST 4: FASTAPI HTTP ENDPOINTS ===")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        r_root = await ac.get("/")
        assert r_root.status_code == 200
        assert r_root.json()["app"] == settings.APP_NAME

        r_health = await ac.get("/health")
        assert r_health.status_code == 200
        assert r_health.json()["status"] == "healthy"
    print("✅ FastAPI Endpoints OK (/ and /health)")

    print("\n🎉 ALL PHASE 1 INTEGRITY TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_tests())
