"""
all_models.py — Memuat seluruh model SQLAlchemy agar mapper registry terkonfigurasi lengkap.
"""
import app.users.models  # noqa: F401
import app.auth.models  # noqa: F401
import app.profiles.models  # noqa: F401
import app.addresses.models  # noqa: F401
import app.products.models  # noqa: F401
import app.cart.models  # noqa: F401
import app.wishlist.models  # noqa: F401
import app.promotions.models  # noqa: F401
import app.orders.models  # noqa: F401
import app.beauty_advisor.models  # noqa: F401
