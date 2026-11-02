"""
env.py — Konfigurasi environment Alembic untuk Topshop Kosmetik AI
Mendukung async engine dengan asyncpg
"""
import asyncio
import os
import sys
from logging.config import fileConfig

# Tambahkan direktori backend ke sys.path agar modul 'app' dapat diimport
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Import konfigurasi aplikasi
from app.core.config import settings

# Objek konfigurasi Alembic (membaca alembic.ini)
config = context.config

# Override URL database dari settings aplikasi
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Setup logging dari konfigurasi alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Import semua model agar Alembic dapat mendeteksi perubahan schema
# Tambahkan import model baru di sini saat Phase berikutnya
from app.core.database import Base  # noqa: F401, E402

# Import model-model untuk Alembic migrations
from app.users.models import User, OAuthAccount, UserSession  # noqa: F401
from app.auth.models import EmailVerification, PasswordResetToken  # noqa: F401
from app.profiles.models import Profile  # noqa: F401
from app.addresses.models import UserAddress  # noqa: F401
from app.products.models import (  # noqa: F401
    Brand, Category, SubCategory, SkinType, SkinConcern, Ingredient, Product, ProductImage
)
from app.cart.models import Cart, CartItem  # noqa: F401
from app.wishlist.models import Wishlist  # noqa: F401
from app.promotions.models import Voucher  # noqa: F401
from app.orders.models import Order, OrderItem, Payment, Shipment, Review  # noqa: F401
from app.beauty_advisor.models import AIConversation, AIMessage  # noqa: F401
from app.core.idempotency import IdempotencyKeyRecord  # noqa: F401

# Metadata target untuk auto-generate migrasi
target_metadata = Base.metadata




def run_migrations_offline() -> None:
    """
    Jalankan migrasi dalam mode 'offline'.
    Mode ini tidak memerlukan koneksi database aktif.
    Berguna untuk generate SQL script tanpa koneksi.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """
    Fungsi helper untuk menjalankan migrasi dengan koneksi yang sudah ada.
    """
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """
    Jalankan migrasi secara asinkron menggunakan async engine.
    Digunakan saat mode 'online' dengan asyncpg.
    """
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    """
    Jalankan migrasi dalam mode 'online'.
    Mode ini memerlukan koneksi database aktif.
    """
    asyncio.run(run_async_migrations())


# Tentukan mode berdasarkan konteks Alembic
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
