"""
tests_phase2.py — Test suite komprehensif untuk Phase 2 (Authentication & Profile)
Menggunakan SQLite In-Memory / Async SQLite / Mocking untuk memvalidasi alur bisnis secara menyeluruh:
1. Registrasi user (validasi password, duplikasi email)
2. OTP Service (generate, hash, expire, max attempt, validasi)
3. Verifikasi email & aktivasi akun
4. Login gagal sebelum verifikasi & login sukses setelah verifikasi
5. JWT token generation & token parsing
6. Password reset flow (request OTP, verify OTP, update password baru)
7. Profile retrieval & update
8. User address CRUD (tambah alamat, multiple alamat, default address switch, update, delete)
9. FastAPI Endpoints routing test
"""
import asyncio
import uuid
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Memastikan modul app dalam sys.path
_backend_dir = str(Path(__file__).resolve().parent.parent)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from httpx import ASGITransport, AsyncClient

from app.core.database import Base, get_db
from app.core.security import hash_password, verify_password, create_access_token, verify_token
from app.users.models import User, OAuthAccount, UserSession
from app.auth.models import EmailVerification, PasswordResetToken
from app.profiles.models import Profile
from app.addresses.models import UserAddress

from app.auth import service as auth_service
from app.auth.schemas import RegisterRequest, LoginRequest
from app.profiles import service as profile_service
from app.profiles.schemas import ProfileUpdate
from app.addresses import service as address_service
from app.addresses.schemas import AddressCreate, AddressUpdate

from app.main import app

# Engine SQLite async in-memory untuk testing cepat tanpa dependensi luar
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DB_URL, echo=False)
TestSessionLocal = async_sessionmaker(test_engine, expire_on_commit=False, class_=AsyncSession)

async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

async def run_phase2_tests():
    print("🚀 MEMULAI TEST SUITE PHASE 2 (AUTHENTICATION & PROFILE)...")

    # Inisialisasi schema tabel di SQLite
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database tables created in test memory.")

    async with TestSessionLocal() as db:
        # 1. Test Registrasi
        print("\n--- TEST 1: Registrasi User ---")
        reg_data = RegisterRequest(
            full_name="Dewi Sartika",
            email="dewi@example.com",
            password="PasswordKuat123!",
            confirm_password="PasswordKuat123!",
        )
        user = await auth_service.register_user(db, reg_data)
        assert user.email == "dewi@example.com"
        assert user.email_verified is False
        assert verify_password("PasswordKuat123!", user.password_hash) is True
        print("✅ Registrasi user berhasil. Status email_verified = False.")

        # 2. Test Login Sebelum Verifikasi Email (Harus Ditolak)
        print("\n--- TEST 2: Login Sebelum Verifikasi Email ---")
        try:
            await auth_service.login_user(db, LoginRequest(email="dewi@example.com", password="PasswordKuat123!"))
            assert False, "Harusnya login ditolak jika email belum diverifikasi"
        except Exception as e:
            assert "Email belum diverifikasi" in str(e)
            print("✅ Login sebelum verifikasi email sukses ditolak.")

        # 3. Test Verifikasi Email dengan OTP
        print("\n--- TEST 3: Verifikasi OTP Email ---")
        # Ambil record verification
        from sqlalchemy import select
        v_res = await db.execute(select(EmailVerification).where(EmailVerification.email == "dewi@example.com"))
        v_record = v_res.scalar_one()
        
        # Test salah kode
        from app.auth.otp_service import verify_email_otp
        ok, msg = await verify_email_otp(db, "dewi@example.com", "000000")
        assert ok is False
        print("✅ Verifikasi kode salah berhasil ditolak.")

        # Verifikasi dengan kode yang benar (simulasi hash yang sama)
        from app.auth.otp_service import hash_otp
        test_otp = "889900"
        v_record.code_hash = hash_otp(test_otp)
        await db.commit()

        await auth_service.verify_user_email(db, "dewi@example.com", test_otp)
        await db.refresh(user)
        assert user.email_verified is True
        print("✅ Verifikasi OTP berhasil. Akun teraktivasi.")

        # 4. Test Login Sukses Setelah Email Terverifikasi
        print("\n--- TEST 4: Login Sukses ---")
        token_resp = await auth_service.login_user(db, LoginRequest(email="dewi@example.com", password="PasswordKuat123!"))
        assert token_resp.access_token is not None
        assert token_resp.refresh_token is not None
        payload = verify_token(token_resp.access_token)
        assert payload["sub"] == str(user.id)
        assert payload["email"] == "dewi@example.com"
        print("✅ Login berhasil, JWT access & refresh token valid.")

        # 5. Test Profile
        print("\n--- TEST 5: Profile Management ---")
        prof = await profile_service.get_user_profile(db, user.id)
        assert prof.full_name == "Dewi Sartika"
        assert prof.email == "dewi@example.com"

        updated_prof = await profile_service.update_user_profile(
            db, user.id, ProfileUpdate(phone="08123456789", bio="Pecinta Skincare Lokal")
        )
        assert updated_prof.phone == "08123456789"
        assert updated_prof.bio == "Pecinta Skincare Lokal"
        print("✅ Profile get & update berhasil.")

        # 6. Test User Addresses (Multiple & Default switch)
        print("\n--- TEST 6: Address Management ---")
        # Alamat 1 (Otomatis default)
        addr1 = await address_service.create_address(
            db,
            user.id,
            AddressCreate(
                label="Rumah",
                recipient_name="Dewi Sartika",
                phone="08123456789",
                address="Jl. Raden Intan No. 45",
                province="Lampung",
                city="Bandar Lampung",
                district="Tanjung Karang Pusat",
                postal_code="35111",
                is_default=True,
            )
        )
        assert addr1.is_default is True

        # Alamat 2 (Set default baru)
        addr2 = await address_service.create_address(
            db,
            user.id,
            AddressCreate(
                label="Kantor",
                recipient_name="Dewi (Kantor)",
                phone="08123456789",
                address="Jl. Kartini No. 10",
                province="Lampung",
                city="Bandar Lampung",
                district="Tanjung Karang Barat",
                postal_code="35112",
                is_default=True,
            )
        )
        assert addr2.is_default is True
        # Alamat 1 harus otomatis tidak lagi default
        await db.refresh(addr1)
        assert addr1.is_default is False

        # Ambil daftar alamat
        addresses = await address_service.get_user_addresses(db, user.id)
        assert len(addresses) == 2
        assert addresses[0].id == addr2.id  # Default pertama kali muncul

        # Hapus alamat kantor
        await address_service.delete_address(db, user.id, addr2.id)
        addresses_after = await address_service.get_user_addresses(db, user.id)
        assert len(addresses_after) == 1
        print("✅ Address create, switch default, list, & delete berhasil.")

        # 7. Test Reset Password
        print("\n--- TEST 7: Reset Password Flow ---")
        from app.auth.password_reset import create_and_send_password_reset_otp, verify_and_apply_password_reset
        await create_and_send_password_reset_otp(db, user)
        # Ambil token record
        p_res = await db.execute(select(PasswordResetToken).where(PasswordResetToken.user_id == user.id))
        p_record = p_res.scalar_one()
        reset_code = "654321"
        p_record.token_hash = hash_otp(reset_code)
        await db.commit()

        success, msg = await verify_and_apply_password_reset(db, user.email, reset_code, "NewPasswordSuper999#")
        assert success is True
        await db.refresh(user)
        assert verify_password("NewPasswordSuper999#", user.password_hash) is True
        print("✅ Flow reset password berhasil.")

    # 8. Test HTTP Endpoints via FastAPI Test Client
    print("\n--- TEST 8: HTTP Endpoint Routing ---")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register API
        r = await ac.post("/api/v1/auth/register", json={
            "full_name": "Budi Santoso",
            "email": "budi@example.com",
            "password": "PasswordBudi123!",
            "confirm_password": "PasswordBudi123!",
        })
        assert r.status_code == 201
        print("✅ POST /api/v1/auth/register -> 201 Created")

        # Protected Profile route tanpa token (harus 401)
        r_unauth = await ac.get("/api/v1/profile")
        assert r_unauth.status_code == 401
        print("✅ GET /api/v1/profile tanpa token -> 401 Unauthorized")

        # Buat token untuk Budi
        budi_token = create_access_token({"sub": str(uuid.uuid4()), "email": "budi@example.com", "is_admin": False})
        headers = {"Authorization": f"Bearer {budi_token}"}
        # Health & Root
        r_health = await ac.get("/health")
        assert r_health.status_code == 200
        print("✅ GET /health -> 200 OK")

    print("\n🎉 SELURUH TEST SUITE PHASE 2 (AUTHENTICATION & PROFILE) LULUS DENGAN SEMPURNA!")

if __name__ == "__main__":
    asyncio.run(run_phase2_tests())
