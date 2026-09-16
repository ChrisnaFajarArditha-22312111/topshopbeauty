"""
main.py — Entry point aplikasi FastAPI Topshop Kosmetik AI
Inisialisasi app, middleware, router, dan lifecycle events
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import close_db, init_db
import app.core.all_models  # noqa: F401

# =========================================================
# Konfigurasi Logging
# =========================================================
logging.basicConfig(
    level=logging.INFO if settings.is_development else logging.WARNING,
    format="%(asctime)s — %(name)s — %(levelname)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# =========================================================
# Lifespan Context Manager (Startup & Shutdown)
# =========================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Mengelola siklus hidup aplikasi FastAPI.
    - Startup: inisialisasi database, koneksi, cache, dll.
    - Shutdown: tutup koneksi, bersihkan resource.
    """
    # === STARTUP ===
    logger.info(f"🚀 Memulai {settings.APP_NAME} [{settings.APP_ENV}]...")
    logger.info(f"   AI Provider: {settings.AI_PROVIDER}")

    # Inisialisasi database (hanya untuk development/testing)
    # Di production, selalu gunakan Alembic migration
    if settings.is_development:
        await init_db()
        logger.info("✅ Database berhasil diinisialisasi")

    logger.info(f"✅ {settings.APP_NAME} siap menerima request")

    yield  # Aplikasi berjalan di sini

    # === SHUTDOWN ===
    logger.info(f"🛑 Menghentikan {settings.APP_NAME}...")
    await close_db()
    logger.info("✅ Semua koneksi database berhasil ditutup")


# =========================================================
# Inisialisasi Aplikasi FastAPI
# =========================================================
app = FastAPI(
    title=settings.APP_NAME,
    description=(
        "API Backend untuk Topshop Kosmetik — Platform e-commerce kosmetik "
        "dengan fitur konsultasi produk berbasis AI (Beauty Advisor)."
    ),
    version="1.0.0",
    docs_url="/api/docs" if settings.is_development else None,
    redoc_url="/api/redoc" if settings.is_development else None,
    openapi_url="/api/openapi.json" if settings.is_development else None,
    lifespan=lifespan,
)

# =========================================================
# Middleware
# =========================================================

# CORS — Izinkan frontend mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_allowed_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# SlowAPI Rate Limiting (In-Memory)
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from app.core.limiter import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# =========================================================
# Include Routers
# Tambahkan router baru di sini seiring progress phase
# =========================================================

# Phase 2 — Authentication & Profile
from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.profiles.router import router as profiles_router
from app.addresses.router import router as addresses_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(profiles_router, prefix="/api/v1/profile", tags=["Profiles"])
app.include_router(addresses_router, prefix="/api/v1/addresses", tags=["Addresses"])

# Phase 3 — Product Management
from app.products.router import router as products_router
from app.categories.router import router as categories_router
from app.brands.router import router as brands_router
from app.skin_types.router import router as skin_types_router
from app.skin_concerns.router import router as skin_concerns_router

app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
app.include_router(categories_router, prefix="/api/v1/categories", tags=["Categories"])
app.include_router(brands_router, prefix="/api/v1/brands", tags=["Brands"])
app.include_router(skin_types_router, prefix="/api/v1/skin-types", tags=["Skin Types"])
app.include_router(skin_concerns_router, prefix="/api/v1/skin-concerns", tags=["Skin Concerns"])

# Phase 4 — E-Commerce
from app.cart.router import router as cart_router
from app.wishlist.router import router as wishlist_router
from app.checkout.router import router as checkout_router
from app.orders.router import router as orders_router
from app.payments.router import router as payments_router
from app.shipping.router import router as shipping_router
from app.promotions.router import router as promotions_router
from app.reviews.router import router as reviews_router

app.include_router(cart_router, prefix="/api/v1/cart", tags=["Cart"])
app.include_router(wishlist_router, prefix="/api/v1/wishlist", tags=["Wishlist"])
app.include_router(checkout_router, prefix="/api/v1/checkout", tags=["Checkout"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(shipping_router, prefix="/api/v1/shipping", tags=["Shipping"])
app.include_router(promotions_router, prefix="/api/v1/promotions", tags=["Promotions"])
app.include_router(reviews_router, prefix="/api/v1/reviews", tags=["Reviews"])


# Phase 5 — AI Beauty Advisor
from app.beauty_advisor.chat.router import router as beauty_advisor_router
app.include_router(beauty_advisor_router, prefix="/api/v1/beauty-advisor", tags=["Beauty Advisor"])


# Phase 6 — Admin
from app.admin.router import router as admin_router
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])


# =========================================================
# Endpoint Dasar
# =========================================================
@app.get("/", tags=["Root"])
async def root() -> JSONResponse:
    """
    Endpoint root — informasi dasar API.
    """
    return JSONResponse(
        content={
            "app": settings.APP_NAME,
            "version": "1.0.0",
            "environment": settings.APP_ENV,
            "docs": "/api/docs" if settings.is_development else None,
            "message": "Selamat datang di Topshop Kosmetik AI API 🛍️",
        }
    )


@app.get("/health", tags=["Health"])
async def health_check() -> JSONResponse:
    """
    Health check endpoint — digunakan oleh Docker dan load balancer
    untuk memastikan service berjalan dengan baik.
    """
    return JSONResponse(
        content={
            "status": "healthy",
            "app": settings.APP_NAME,
            "environment": settings.APP_ENV,
        }
    )
