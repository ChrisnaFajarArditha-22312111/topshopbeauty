"""
tests_all_endpoints.py — Script Testing Komprehensif Semua Endpoint API
Topshop Kosmetik AI Backend

Menguji seluruh endpoint API:
- Health & Root
- Authentication & User Management (Guest, Unverified, Verified, Admin)
- Protected Customer Endpoints (Profile, Addresses, Cart, Wishlist, Checkout, Orders)
- Products Catalog (Multi-filter, Sorting, Detail)
- Master Data (Categories, Brands, Skin Types, Skin Concerns)
- Promotions & Vouchers
- Logistics & Shipping (Biteship)
- AI Beauty Advisor (Chat, Guardrails, Context Persistence)
- Reviews & Ratings
- Payments & Webhook (Mayar)
- Admin Dashboard (RBAC, Overview Stats, Product CRUD, Order Status & Tracking, Customer Management, Master Data, Vouchers)
- OpenAPI Documentation
"""

import sys
import json
import random
import string
import requests
from datetime import datetime

# =========================================================
# KONFIGURASI
# =========================================================
BASE_URL = "http://localhost:8000"
TIMEOUT = 12  # detik

# Warna terminal ANSI
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"


# =========================================================
# HELPER
# =========================================================
class TestResult:
    def __init__(self):
        self.passed  = 0
        self.failed  = 0
        self.skipped = 0
        self.results = []

    def add(self, name, status, detail="", code=None):
        self.results.append({"name": name, "status": status, "detail": detail, "code": code})
        if status == "PASS":   self.passed  += 1
        elif status == "FAIL": self.failed  += 1
        elif status == "SKIP": self.skipped += 1

    def summary(self):
        total = self.passed + self.failed + self.skipped
        print(f"\n{'='*70}")
        print(f"{BOLD}📊 HASIL TESTING SEMUA ENDPOINT{RESET}")
        print(f"{'='*70}")
        print(f"  Total  : {total} endpoint diuji")
        print(f"  {GREEN}✅ PASS   : {self.passed}{RESET}")
        print(f"  {RED}❌ FAIL   : {self.failed}{RESET}")
        print(f"  {YELLOW}⏭️  SKIP   : {self.skipped}{RESET}")
        print(f"{'='*70}")
        if self.failed > 0:
            print(f"\n{RED}{BOLD}❌ Endpoint yang GAGAL:{RESET}")
            for r in self.results:
                if r["status"] == "FAIL":
                    code_str = f" [{r['code']}]" if r["code"] else ""
                    print(f"  • {r['name']}{code_str} — {r['detail']}")
        if self.skipped > 0:
            print(f"\n{YELLOW}{BOLD}⏭️  Endpoint yang di-SKIP:{RESET}")
            for r in self.results:
                if r["status"] == "SKIP":
                    print(f"  • {r['name']} — {r['detail']}")
        print()
        return self.failed == 0


results = TestResult()

def test(name, method, path, expected, json_body=None, headers=None, params=None,
         skip_if=False, skip_reason=""):
    """Jalankan satu HTTP request test dan catat hasilnya."""
    if skip_if:
        results.add(name, "SKIP", skip_reason)
        print(f"  {YELLOW}⏭️  SKIP{RESET}  {name} — {skip_reason}")
        return None

    url = f"{BASE_URL}{path}"
    try:
        resp = requests.request(method, url, json=json_body,
                                headers=headers or {}, params=params or {},
                                timeout=TIMEOUT)
        
        # Dukungan multi expected status (misal [200, 201])
        if isinstance(expected, list):
            ok = resp.status_code in expected
        else:
            ok = resp.status_code == expected

        icon  = "✅" if ok else "❌"
        color = GREEN if ok else RED
        code_info = f"{CYAN}[{resp.status_code}]{RESET}"

        if ok:
            results.add(name, "PASS", "", resp.status_code)
            print(f"  {color}{icon} PASS{RESET}  {name} {code_info}")
        else:
            try:
                detail = resp.json().get("detail", resp.text[:120])
            except Exception:
                detail = resp.text[:120]
            results.add(name, "FAIL", f"Expected {expected}, got {resp.status_code}: {detail}", resp.status_code)
            print(f"  {color}{icon} FAIL{RESET}  {name} {code_info} — {detail}")

        return resp

    except requests.exceptions.ConnectionError:
        results.add(name, "FAIL", "Server tidak bisa dihubungi", None)
        print(f"  {RED}❌ FAIL{RESET}  {name} — ⚠️  Server tidak bisa dihubungi! Jalankan: docker compose up -d")
        return None
    except requests.exceptions.Timeout:
        results.add(name, "FAIL", "Request timeout", None)
        print(f"  {RED}❌ FAIL{RESET}  {name} — ⏰ Request timeout ({TIMEOUT}s)")
        return None


def section(title):
    print(f"\n{BOLD}{BLUE}{'─'*70}{RESET}")
    print(f"{BOLD}{BLUE}  {title}{RESET}")
    print(f"{BOLD}{BLUE}{'─'*70}{RESET}")


def random_email():
    rand = ''.join(random.choices(string.ascii_lowercase, k=8))
    return f"test_{rand}@topshoptest.com"


# =========================================================
# STATE — Data dibagikan antar test
# =========================================================
S = {
    "access_token":     None,
    "admin_token":      None,
    "user_email":       None,
    "user_password":    "TestPassword123!",
    "product_id":       None,
    "brand_id":         None,
    "category_id":      None,
    "admin_product_id": None,
    "admin_voucher_id": None,
    "conversation_id":  None,
    "address_id":       None,
    "cart_item_id":     None,
}

def auth_hdr(token=None):
    tok = token or S["access_token"]
    return {"Authorization": f"Bearer {tok}"} if tok else {}

def admin_hdr():
    return auth_hdr(S["admin_token"])


# =========================================================
# MAIN
# =========================================================
def main():
    print(f"\n{BOLD}{'='*70}")
    print(f"  🛍️  TOPSHOP KOSMETIK — ENDPOINT TESTING SUITE")
    print(f"  Waktu   : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Server  : {BASE_URL}")
    print(f"{'='*70}{RESET}")

    # ── 0. HEALTH CHECK ──────────────────────────────────────────
    section("0. Health Check & Root")
    test("GET /",        "GET", "/", 200)
    test("GET /health",  "GET", "/health", 200)

    # ── 1. AUTH — REGISTER ───────────────────────────────────────
    section("1. Auth — Register")
    email = random_email()
    S["user_email"] = email

    test("POST /api/v1/auth/register", "POST", "/api/v1/auth/register", 201,
         json_body={
             "full_name": "Pengguna Baru Test",
             "email": email,
             "password": S["user_password"],
             "confirm_password": S["user_password"]
         })

    test("POST /api/v1/auth/register (duplikat)", "POST", "/api/v1/auth/register", 400,
         json_body={
             "full_name": "Pengguna Baru Test",
             "email": email,
             "password": S["user_password"],
             "confirm_password": S["user_password"]
         })

    test("POST /api/v1/auth/register (email tidak valid)", "POST", "/api/v1/auth/register", 422,
         json_body={"full_name": "Test", "email": "bukanemailvalid", "password": "abc", "confirm_password": "abc"})

    test("POST /api/v1/auth/resend-verification", "POST", "/api/v1/auth/resend-verification", 200,
         json_body={"email": email})

    # Verifikasi OTP dengan kode salah — expected 400
    test("POST /api/v1/auth/verify-email (kode salah)", "POST", "/api/v1/auth/verify-email", 400,
         json_body={"email": email, "code": "000000"})

    # ── 2. AUTH — LOGIN ──────────────────────────────────────────
    section("2. Auth — Login")
    # Akun yang baru didaftarkan belum verified -> expected 403
    test("POST /api/v1/auth/login (belum verified)", "POST", "/api/v1/auth/login", 403,
         json_body={"email": email, "password": S["user_password"]})

    test("POST /api/v1/auth/login (password salah)", "POST", "/api/v1/auth/login", 401,
         json_body={"email": email, "password": "SalahPassword999"})

    test("POST /api/v1/auth/login (email tidak ada)", "POST", "/api/v1/auth/login", 401,
         json_body={"email": "tidakada@topshopkosmetik.com", "password": "Password123!"})

    # Login customer verified
    resp = test("POST /api/v1/auth/login (customer verified)", "POST", "/api/v1/auth/login", 200,
                json_body={"email": "customer@topshopkosmetik.com", "password": "Customer123!"})
    if resp and resp.status_code == 200:
        S["access_token"] = resp.json().get("access_token")
        print(f"    {GREEN}→ Customer token OK: {S['access_token'][:20]}...{RESET}")

    # Login admin
    resp = test("POST /api/v1/auth/login (admin)", "POST", "/api/v1/auth/login", 200,
                json_body={"email": "admin@topshopkosmetik.com", "password": "Admin123!"})
    if resp and resp.status_code == 200:
        S["admin_token"] = resp.json().get("access_token")
        print(f"    {GREEN}→ Admin token OK: {S['admin_token'][:20]}...{RESET}")

    # ── 3. AUTH — FORGOT PASSWORD ─────────────────────────────────
    section("3. Auth — Forgot Password Flow")
    test("POST /api/v1/auth/forgot-password", "POST", "/api/v1/auth/forgot-password", 200,
         json_body={"email": email})

    test("POST /api/v1/auth/reset-password (kode salah)", "POST", "/api/v1/auth/reset-password", 400,
         json_body={
             "email": email,
             "code": "000000",
             "new_password": "NewPassword123!",
             "confirm_password": "NewPassword123!"
         })

    # ── 4. AUTH — GOOGLE OAUTH ────────────────────────────────────
    section("4. Auth — Google OAuth")
    test("POST /api/v1/auth/google (token invalid)", "POST", "/api/v1/auth/google", 401,
         json_body={"id_token": "invalid_google_token"})

    # ── 5. AUTH — TANPA TOKEN (401) ───────────────────────────────
    section("5. Endpoint Protected — Tanpa Token (Expected 401)")
    test("GET /api/v1/users/me (tanpa token)",               "GET", "/api/v1/users/me", 401)
    test("GET /api/v1/profile (tanpa token)",                "GET", "/api/v1/profile", 401)
    test("GET /api/v1/addresses (tanpa token)",              "GET", "/api/v1/addresses", 401)
    test("GET /api/v1/cart (tanpa token)",                   "GET", "/api/v1/cart", 401)
    test("GET /api/v1/wishlist (tanpa token)",               "GET", "/api/v1/wishlist", 401)
    test("GET /api/v1/orders (tanpa token)",                 "GET", "/api/v1/orders", 401)
    test("POST /api/v1/checkout (tanpa token)",              "POST", "/api/v1/checkout", 401)
    test("POST /api/v1/checkout/preview (tanpa token)",      "POST", "/api/v1/checkout/preview", 401)
    test("GET /api/v1/reviews/me (tanpa token)",             "GET", "/api/v1/reviews/me", 401)
    test("POST /api/v1/reviews (tanpa token)",               "POST", "/api/v1/reviews", 401)
    test("POST /api/v1/auth/logout (tanpa token)",           "POST", "/api/v1/auth/logout", 401)
    test("GET /api/v1/beauty-advisor/conversations (tanpa token)", "GET", "/api/v1/beauty-advisor/conversations", 401)

    # ── 6. AUTH — REFRESH TOKEN ───────────────────────────────────
    section("6. Auth — Refresh Token")
    test("POST /api/v1/auth/refresh (body kosong)",   "POST", "/api/v1/auth/refresh", 422, json_body={})
    test("POST /api/v1/auth/refresh (token invalid)", "POST", "/api/v1/auth/refresh", 401,
         json_body={"refresh_token": "invalid_token_xxx"})

    # ── 7. CUSTOMER PROFILE & ADDRESS ─────────────────────────────
    section("7. Customer Profile & Addresses (Authenticated)")
    test("GET /api/v1/users/me", "GET", "/api/v1/users/me", 200, headers=auth_hdr())
    test("GET /api/v1/profile",  "GET", "/api/v1/profile",  200, headers=auth_hdr())
    test("PATCH /api/v1/profile", "PATCH", "/api/v1/profile", 200, headers=auth_hdr(),
         json_body={"bio": "Suka produk skincare alami dan hydrating."})
    
    resp = test("GET /api/v1/addresses", "GET", "/api/v1/addresses", 200, headers=auth_hdr())
    if resp and resp.status_code == 200 and resp.json():
        S["address_id"] = resp.json()[0]["id"]
        test("GET /api/v1/addresses/{id}", "GET", f"/api/v1/addresses/{S['address_id']}", 200, headers=auth_hdr())

    # ── 8. PRODUCTS ───────────────────────────────────────────────
    section("8. Products — Katalog Publik")
    resp = test("GET /api/v1/products", "GET", "/api/v1/products", 200)
    if resp and resp.status_code == 200:
        items = resp.json().get("items", [])
        if items:
            S["product_id"] = items[0]["id"]
            print(f"    {GREEN}→ {len(items)} produk ditemukan. Menggunakan: {S['product_id']}{RESET}")

    test("GET /api/v1/products (q=serum)",       "GET", "/api/v1/products", 200, params={"q": "serum"})
    test("GET /api/v1/products (sort=termurah)", "GET", "/api/v1/products", 200, params={"sort_by": "termurah"})
    test("GET /api/v1/products (sort=termahal)", "GET", "/api/v1/products", 200, params={"sort_by": "termahal"})
    test("GET /api/v1/products (sort=rating)",   "GET", "/api/v1/products", 200, params={"sort_by": "rating"})
    test("GET /api/v1/products (sort=terlaris)", "GET", "/api/v1/products", 200, params={"sort_by": "terlaris"})
    test("GET /api/v1/products (filter harga)",  "GET", "/api/v1/products", 200,
         params={"min_price": 5000, "max_price": 200000})
    test("GET /api/v1/products (is_skincare)",   "GET", "/api/v1/products", 200,
         params={"is_skincare": True})
    test("GET /api/v1/products (pagination)",    "GET", "/api/v1/products", 200,
         params={"page": 1, "page_size": 10})
    test("GET /api/v1/products/{id} (valid)",    "GET",
         f"/api/v1/products/{S['product_id']}", 200,
         skip_if=not S["product_id"], skip_reason="Tidak ada produk di database")
    test("GET /api/v1/products/{id} (tidak ada)","GET",
         "/api/v1/products/00000000-0000-0000-0000-000000000000", 404)

    # ── 9. MASTER DATA ────────────────────────────────────────────
    section("9. Master Data")
    resp = test("GET /api/v1/categories", "GET", "/api/v1/categories", 200)
    if resp and resp.status_code == 200 and resp.json():
        S["category_id"] = resp.json()[0]["id"]

    resp = test("GET /api/v1/brands", "GET", "/api/v1/brands", 200)
    if resp and resp.status_code == 200 and resp.json():
        S["brand_id"] = resp.json()[0]["id"]

    test("GET /api/v1/skin-types",   "GET", "/api/v1/skin-types", 200)
    test("GET /api/v1/skin-concerns","GET", "/api/v1/skin-concerns", 200)

    # ── 10. CART & WISHLIST ───────────────────────────────────────
    section("10. Cart & Wishlist (Authenticated)")
    # Kosongkan keranjang terlebih dahulu agar state selalu bersih
    test("DELETE /api/v1/cart (kosongkan keranjang)", "DELETE", "/api/v1/cart", 200, headers=auth_hdr())
    test("GET /api/v1/cart (keranjang kosong)", "GET", "/api/v1/cart", 200, headers=auth_hdr())
    
    if S["product_id"]:
        resp = test("POST /api/v1/cart/items (tambah produk)", "POST", "/api/v1/cart/items", 200,
                    headers=auth_hdr(), json_body={"product_id": S["product_id"], "quantity": 1})
        if resp and resp.status_code == 200 and resp.json().get("items"):
            S["cart_item_id"] = resp.json()["items"][0]["id"]
            test("PATCH /api/v1/cart/items/{id} (update kuantitas)", "PATCH",
                 f"/api/v1/cart/items/{S['cart_item_id']}", 200,
                 headers=auth_hdr(), json_body={"quantity": 1})

        # Reset wishlist agar idempotence
        test("DELETE /api/v1/wishlist/{product_id} (reset)", "DELETE",
             f"/api/v1/wishlist/{S['product_id']}", 200, headers=auth_hdr())
        test("POST /api/v1/wishlist (tambah wishlist)", "POST", "/api/v1/wishlist", [200, 201],
             headers=auth_hdr(), json_body={"product_id": S["product_id"]})
        test("GET /api/v1/wishlist", "GET", "/api/v1/wishlist", 200, headers=auth_hdr())
        test("DELETE /api/v1/wishlist/{product_id}", "DELETE",
             f"/api/v1/wishlist/{S['product_id']}", 200, headers=auth_hdr())

    # ── 11. CHECKOUT & ORDERS ─────────────────────────────────────
    section("11. Checkout & Orders (Authenticated)")
    test("POST /api/v1/checkout/preview", "POST", "/api/v1/checkout/preview", 200,
         headers=auth_hdr(),
         json_body={
             "address_id": S["address_id"],
             "courier_code": "jne",
             "service_code": "reg",
             "voucher_code": None
         },
         skip_if=not S["address_id"], skip_reason="Tidak ada alamat tersimpan")

    test("GET /api/v1/orders", "GET", "/api/v1/orders", 200, headers=auth_hdr())

    # ── 12. PROMOTIONS ────────────────────────────────────────────
    section("12. Promotions — Voucher")
    test("GET /api/v1/promotions/vouchers", "GET", "/api/v1/promotions/vouchers", 200)
    
    # Validasi kode voucher tidak ada menghasilkan 200 is_valid: false
    test("POST /api/v1/promotions/validate (kode tidak ada)", "POST",
         "/api/v1/promotions/validate", 200,
         json_body={"code": "KODEPALSUXXX", "subtotal": 100000})

    test("POST /api/v1/promotions/validate (body kosong)", "POST",
         "/api/v1/promotions/validate", 422, json_body={})

    # ── 13. SHIPPING ──────────────────────────────────────────────
    section("13. Shipping (Dev Mock Mode)")
    test("GET /api/v1/shipping/rates (tanpa token)", "GET", "/api/v1/shipping/rates", 401)
    test("GET /api/v1/shipping/rates (tanpa parameter)", "GET", "/api/v1/shipping/rates", 422, headers=auth_hdr())
    test("GET /api/v1/shipping/rates (dev mock)", "GET", "/api/v1/shipping/rates", 200,
         headers=auth_hdr(),
         params={"address_id": S["address_id"], "courier": "all"},
         skip_if=not S["address_id"], skip_reason="Tidak ada alamat tersimpan")
    test("GET /api/v1/shipping/track/{resi} (dev mock)", "GET", "/api/v1/shipping/track/JNE123456789",
         200, headers=auth_hdr())

    # ── 14. BEAUTY ADVISOR ────────────────────────────────────────
    section("14. Beauty Advisor — Chat (Guest & User)")
    resp = test("POST /api/v1/beauty-advisor/chat (guest)", "POST",
                "/api/v1/beauty-advisor/chat", 200,
                json_body={"message": "Rekomendasikan toner untuk kulit berminyak", "conversation_id": None})
    if resp and resp.status_code == 200:
        S["conversation_id"] = resp.json().get("conversation_id")
        print(f"    {GREEN}→ conversation_id: {S['conversation_id']}{RESET}")

    test("POST /api/v1/beauty-advisor/chat (off-topic)", "POST",
         "/api/v1/beauty-advisor/chat", 200,
         json_body={"message": "Berapa harga saham BBCA hari ini?", "conversation_id": None})

    test("POST /api/v1/beauty-advisor/chat (pesan kosong)", "POST",
         "/api/v1/beauty-advisor/chat", 422,
         json_body={"message": "", "conversation_id": None})

    test("POST /api/v1/beauty-advisor/chat (lanjut sesi)", "POST",
         "/api/v1/beauty-advisor/chat", 200,
         json_body={"message": "Apa perbedaan moisturizer dan toner?",
                    "conversation_id": S["conversation_id"]},
         skip_if=not S["conversation_id"], skip_reason="Tidak ada sesi percakapan")

    test("GET /api/v1/beauty-advisor/conversations (user)", "GET",
         "/api/v1/beauty-advisor/conversations", 200, headers=auth_hdr())

    # ── 15. REVIEWS ───────────────────────────────────────────────
    section("15. Reviews")
    test("GET /api/v1/reviews/product/{id} (valid)", "GET",
         f"/api/v1/reviews/product/{S['product_id']}", 200,
         skip_if=not S["product_id"], skip_reason="Tidak ada produk")
    test("GET /api/v1/reviews/product/{id} (tidak ada)", "GET",
         "/api/v1/reviews/product/00000000-0000-0000-0000-000000000000", 200)
    test("GET /api/v1/reviews/me (user)", "GET", "/api/v1/reviews/me", 200, headers=auth_hdr())

    # ── 16. PAYMENTS WEBHOOK ──────────────────────────────────────
    section("16. Payments — Webhook")
    test("POST /api/v1/payments/webhook (unprocessed/invalid)", "POST",
         "/api/v1/payments/webhook", 200,
         json_body={"event": "payment.unsupported", "data": {}})
    test("GET /api/v1/payments/order/{id} (tanpa token)", "GET",
         "/api/v1/payments/order/00000000-0000-0000-0000-000000000000", 401)

    # ── 17. ADMIN — PROTEKSI RBAC ─────────────────────────────────
    section("17. Admin — Proteksi RBAC (Tanpa Token & Non-Admin)")
    test("GET /api/v1/admin/dashboard/stats (tanpa token)",  "GET", "/api/v1/admin/dashboard/stats", 401)
    test("GET /api/v1/admin/dashboard/stats (non-admin 403)","GET", "/api/v1/admin/dashboard/stats", 403, headers=auth_hdr())
    test("GET /api/v1/admin/orders (tanpa token)",           "GET", "/api/v1/admin/orders", 401)
    test("GET /api/v1/admin/customers (tanpa token)",        "GET", "/api/v1/admin/customers", 401)
    test("POST /api/v1/admin/products (tanpa token)",        "POST", "/api/v1/admin/products", 401)
    test("GET /api/v1/admin/promotions/vouchers (tanpa token)","GET", "/api/v1/admin/promotions/vouchers", 401)

    has_admin = bool(S["admin_token"])

    # ── 18. ADMIN — DASHBOARD & ORDERS ────────────────────────────
    section("18. Admin — Dashboard & Orders")
    test("GET /api/v1/admin/dashboard/stats", "GET", "/api/v1/admin/dashboard/stats", 200,
         headers=admin_hdr(), skip_if=not has_admin, skip_reason="Tidak ada admin token")
    test("GET /api/v1/admin/orders",              "GET", "/api/v1/admin/orders", 200,
         headers=admin_hdr(), skip_if=not has_admin, skip_reason="Tidak ada admin token")
    test("GET /api/v1/admin/orders (filter paid)","GET", "/api/v1/admin/orders", 200,
         headers=admin_hdr(), params={"status": "paid"},
         skip_if=not has_admin, skip_reason="Tidak ada admin token")
    test("GET /api/v1/admin/customers", "GET", "/api/v1/admin/customers", 200,
         headers=admin_hdr(), skip_if=not has_admin, skip_reason="Tidak ada admin token")

    # ── 19. ADMIN — PRODUCT CRUD ──────────────────────────────────
    section("19. Admin — Product CRUD")
    rnd = random.randint(1000, 9999)
    resp = test("POST /api/v1/admin/products (buat produk)", "POST", "/api/v1/admin/products", 201,
                headers=admin_hdr(),
                json_body={
                    "nama_produk": f"Produk Test Automation {rnd}",
                    "brand_id": S["brand_id"],
                    "category_id": S["category_id"],
                    "harga": 75000, "harga_asli": 100000, "stok": 50,
                    "deskripsi": "Test produk dari automation script",
                    "is_skincare": True, "texture": "Gel",
                    "usage_time": "Pagi & Malam",
                },
                skip_if=not has_admin, skip_reason="Tidak ada admin token")
    if resp and resp.status_code == 201:
        S["admin_product_id"] = resp.json().get("id")
        print(f"    {GREEN}→ Produk dibuat: {S['admin_product_id']}{RESET}")

    test("PATCH /api/v1/admin/products/{id}", "PATCH",
         f"/api/v1/admin/products/{S['admin_product_id']}", 200,
         headers=admin_hdr(), json_body={"harga": 80000, "stok": 45},
         skip_if=not S["admin_product_id"], skip_reason="Produk test tidak dibuat")

    # ── 20. ADMIN — MASTER DATA ───────────────────────────────────
    section("20. Admin — Master Data")
    test("POST /api/v1/admin/categories",   "POST", "/api/v1/admin/categories", 201,
         headers=admin_hdr(), json_body={"name": f"TestKat{rnd}", "slug": f"test-kat-{rnd}"},
         skip_if=not has_admin, skip_reason="Tidak ada admin token")
    test("POST /api/v1/admin/brands",       "POST", "/api/v1/admin/brands", 201,
         headers=admin_hdr(), json_body={"name": f"TestBrand{rnd}", "slug": f"test-brand-{rnd}"},
         skip_if=not has_admin, skip_reason="Tidak ada admin token")
    test("POST /api/v1/admin/skin-types",   "POST", "/api/v1/admin/skin-types", 201,
         headers=admin_hdr(), json_body={"name": f"TestSkin{rnd}"},
         skip_if=not has_admin, skip_reason="Tidak ada admin token")
    test("POST /api/v1/admin/skin-concerns","POST", "/api/v1/admin/skin-concerns", 201,
         headers=admin_hdr(), json_body={"name": f"TestConcern{rnd}"},
         skip_if=not has_admin, skip_reason="Tidak ada admin token")
    test("POST /api/v1/admin/ingredients",  "POST", "/api/v1/admin/ingredients", 201,
         headers=admin_hdr(), json_body={"name": f"TestIngredient{rnd}"},
         skip_if=not has_admin, skip_reason="Tidak ada admin token")

    # ── 21. ADMIN — VOUCHER MANAGEMENT ────────────────────────────
    section("21. Admin — Voucher Management")
    resp = test("POST /api/v1/admin/promotions/vouchers", "POST",
                "/api/v1/admin/promotions/vouchers", 201,
                headers=admin_hdr(),
                json_body={
                    "code": f"AUTOPROMO{rnd}",
                    "name": f"Promo Diskon {rnd}",
                    "discount_type": "percentage",
                    "discount_amount": 10.0,
                    "min_purchase": 50000.0,
                    "start_date": "2026-09-01T00:00:00Z",
                    "end_date": "2027-12-31T23:59:59Z",
                    "usage_limit": 100,
                    "is_active": True,
                },
                skip_if=not has_admin, skip_reason="Tidak ada admin token")
    if resp and resp.status_code == 201:
        S["admin_voucher_id"] = resp.json().get("id")

    test("GET /api/v1/admin/promotions/vouchers", "GET", "/api/v1/admin/promotions/vouchers", 200,
         headers=admin_hdr(), skip_if=not has_admin, skip_reason="Tidak ada admin token")

    test("PATCH /api/v1/admin/promotions/vouchers/{id}/toggle", "PATCH",
         f"/api/v1/admin/promotions/vouchers/{S['admin_voucher_id']}/toggle", 200,
         headers=admin_hdr(), params={"is_active": False},
         skip_if=not S["admin_voucher_id"], skip_reason="Voucher test tidak dibuat")

    # ── 22. CLEANUP ───────────────────────────────────────────────
    section("22. Cleanup — Hapus Data Test")
    test("DELETE /api/v1/admin/products/{id}", "DELETE",
         f"/api/v1/admin/products/{S['admin_product_id']}", 200,
         headers=admin_hdr(),
         skip_if=not S["admin_product_id"], skip_reason="Tidak ada produk test")

    # ── 23. API DOCS ──────────────────────────────────────────────
    section("23. API Documentation")
    test("GET /api/docs",         "GET", "/api/docs", 200)
    test("GET /api/redoc",        "GET", "/api/redoc", 200)
    test("GET /api/openapi.json", "GET", "/api/openapi.json", 200)

    # ── SUMMARY ───────────────────────────────────────────────────
    success = results.summary()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
