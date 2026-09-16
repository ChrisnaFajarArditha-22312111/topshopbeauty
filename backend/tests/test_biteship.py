"""
test_biteship.py — Script Pengujian Langsung ke API Biteship
Menggunakan testing key resmi dari Biteship Platform.

Fitur yang diuji:
1. GET  /v1/couriers          — Daftar ekspedisi yang didukung (JNE, SiCepat, J&T, dll)
2. GET  /v1/maps/areas        — Pencarian Area ID wilayah Bandar Lampung
3. POST /v1/rates/couriers    — Hitung ongkir berdasarkan Kode Pos (Bandar Lampung -> Jakarta)
4. POST /v1/rates/couriers    — Hitung ongkir berdasarkan Area ID
"""

import sys
import json
import httpx

# API Testing Key Biteship
BITESHIP_API_KEY = "biteship_test.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoidG9wc2hvcHAiLCJ1c2VySWQiOiI2YWEzMGM4MzY1NTc4OTQxNzZkOTRmNTEiLCJpYXQiOjE3ODkxNjU1MDR9.zY8kmt2uZX2mN-aAZONRQy7fApK32bz0S7mq-1wODbY"
BASE_URL = "https://api.biteship.com/v1"

# Terminal Colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

HEADERS = {
    "Authorization": f"Bearer {BITESHIP_API_KEY}",
    "Content-Type": "application/json",
}


def print_section(title):
    print(f"\n{BOLD}{CYAN}{'='*65}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'='*65}{RESET}")


def test_get_couriers():
    """1. Uji daftar kurir yang aktif di Biteship."""
    print_section("1. Test GET /v1/couriers (Daftar Ekspedisi yang Didukung)")
    url = f"{BASE_URL}/couriers"
    try:
        r = httpx.get(url, headers=HEADERS, timeout=10.0)
        print(f"HTTP Status: {BOLD}[{r.status_code}]{RESET}")
        if r.status_code == 200:
            data = r.json().get("couriers", [])
            print(f"{GREEN}✅ Berhasil terhubung ke Biteship API!{RESET}")
            print(f"Total kurir didukung: {BOLD}{len(data)}{RESET} ekspedisi")
            courier_names = [f"{c.get('courier_name')} ({c.get('courier_code')})" for c in data[:8]]
            print(f"Contoh kurir: {', '.join(courier_names)} ...")
            return True
        else:
            print(f"{RED}❌ Respon: {r.text}{RESET}")
            return False
    except Exception as e:
        print(f"{RED}❌ Error koneksi: {e}{RESET}")
        return False


def test_search_areas():
    """2. Uji pencarian Area ID (Origin: Bandar Lampung)."""
    print_section("2. Test GET /v1/maps/areas (Pencarian Area Bandar Lampung)")
    url = f"{BASE_URL}/maps/areas"
    params = {"countries": "ID", "input": "Bandar Lampung"}
    try:
        r = httpx.get(url, headers=HEADERS, params=params, timeout=10.0)
        print(f"HTTP Status: {BOLD}[{r.status_code}]{RESET}")
        if r.status_code == 200:
            areas = r.json().get("areas", [])
            print(f"{GREEN}✅ Berhasil menemukan {len(areas)} area di Bandar Lampung!{RESET}")
            if areas:
                first = areas[0]
                print(f"  • Nama Area : {BOLD}{first.get('name')}{RESET}")
                print(f"  • Area ID   : {CYAN}{first.get('id')}{RESET}")
                print(f"  • Kode Pos  : {first.get('postal_code')}")
                return first.get("id")
        else:
            print(f"{RED}❌ Respon: {r.text}{RESET}")
            return None
    except Exception as e:
        print(f"{RED}❌ Error koneksi: {e}{RESET}")
        return None


def test_rates_by_postal_code():
    """3. Uji hitung ongkir berdasarkan Postal Code."""
    print_section("3. Test POST /v1/rates/couriers (by Postal Code)")
    url = f"{BASE_URL}/rates/couriers"
    payload = {
        # Toko Topshop Kosmetik: Bandar Lampung
        "origin_postal_code": 35111,
        # Tujuan pembeli: Jakarta Selatan
        "destination_postal_code": 12430,
        "couriers": "jne,sicepat,jnt",
        "items": [
            {
                "name": "Wardah UV Shield Sunscreen & Serum",
                "value": 85000,
                "weight": 350,  # 350 gram
                "quantity": 1,
            }
        ],
    }

    print(f"Rute Kirim : Bandar Lampung ({payload['origin_postal_code']}) ➔ Jakarta ({payload['destination_postal_code']})")
    print(f"Barang     : {payload['items'][0]['name']} ({payload['items'][0]['weight']}g)")
    print(f"Kurir      : {payload['couriers']}")
    print("Mengirim request...")

    try:
        r = httpx.post(url, json=payload, headers=HEADERS, timeout=10.0)
        print(f"HTTP Status: {BOLD}[{r.status_code}]{RESET}")
        res_json = r.json()

        if r.status_code == 200:
            pricing = res_json.get("pricing", [])
            print(f"{GREEN}✅ Berhasil mendapatkan {len(pricing)} opsi ongkir real-time!{RESET}\n")
            print(f"{'Ekspedisi':<20} {'Layanan':<20} {'Tarif':<15} {'Estimasi'}")
            print("-" * 65)
            for p in pricing:
                c_name = p.get("courier_name")
                c_service = p.get("courier_service_name")
                c_price = f"Rp {p.get('price'):,}"
                c_etd = p.get("shipment_duration_range") + " " + p.get("shipment_duration_unit", "")
                print(f"{c_name:<20} {c_service:<20} {c_price:<15} {c_etd}")
            return True
        else:
            print(f"{YELLOW}⚠️  Pesan dari Biteship API:{RESET}")
            print(f"    {res_json}")
            if "balance" in str(res_json).lower():
                print(f"\n{YELLOW}💡 Catatan Saldo Testing Biteship:{RESET}")
                print("   Biteship membutuhkan saldo akun (test credits) untuk endpoint Rates.")
                print("   Di dashboard.biteship.com -> Wallet -> klik 'Top Up Test Balance'.")
            return False
    except Exception as e:
        print(f"{RED}❌ Error koneksi: {e}{RESET}")
        return False


def main():
    print(f"{BOLD}{'='*65}")
    print(f"  🚚 TOPSHOP KOSMETIK — BITESHIP API TESTER")
    print(f"  Key : {BITESHIP_API_KEY[:25]}...")
    print(f"{'='*65}{RESET}")

    # 1. Test couriers
    test_get_couriers()

    # 2. Test search areas
    area_id = test_search_areas()

    # 3. Test rates by postal code
    test_rates_by_postal_code()

    print(f"\n{BOLD}{GREEN}🎉 Pengujian selesai!{RESET}\n")


if __name__ == "__main__":
    main()
