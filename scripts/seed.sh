#!/usr/bin/env bash
# ==============================================================================
# seed.sh — Mengisi Ulang Database dengan Data Akun & Katalog Produk
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

# Deteksi container backend yang sedang berjalan
if docker ps --filter "name=topshop_backend_prod" -q | grep -q . ; then
    CONTAINER="topshop_backend_prod"
    MODE="PRODUCTION (VPS)"
elif docker ps --filter "name=topshop_backend" -q | grep -q . ; then
    CONTAINER="topshop_backend"
    MODE="DEVELOPMENT LOKAL"
else
    echo -e "${RED}❌ Error: Tidak ada container backend yang sedang aktif!${NC}"
    echo -e "${YELLOW}   Jalankan terlebih dahulu: ./scripts/start.sh (atau ./scripts/start.sh --prod)${NC}"
    exit 1
fi

echo -e "${BOLD}${CYAN}🌱 Menjalankan Seeding Data Awal ke Database [${MODE}]...${NC}"

echo -e "  • 1. Memastikan skema database termigrasi (Alembic)..."
docker exec "$CONTAINER" alembic upgrade head

echo -e "  • 2. Mengimpor akun uji coba & katalog produk dari products.json..."
docker exec "$CONTAINER" python seed_dev_data.py

echo -e "${GREEN}✅ Seeding data dan katalog produk berhasil disinkronkan!${NC}\n"
