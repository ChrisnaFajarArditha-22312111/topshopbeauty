#!/usr/bin/env bash
# ==============================================================================
# stop.sh — Menghentikan Semua Service Container Docker Topshop (Local & VPS)
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}${CYAN}🛑 Menghentikan seluruh service container Topshop Kosmetik AI...${NC}"

# Cek apakah container production berjalan
if docker ps --filter "name=topshop_backend_prod" -q | grep -q . ; then
    echo -e "  • Mematikan container Production (docker-compose.prod.yml)..."
    docker compose -f docker-compose.prod.yml down
elif [ -f docker-compose.prod.yml ] && [[ "$*" == *"--prod"* ]]; then
    docker compose -f docker-compose.prod.yml down
else
    # Matikan container dev jika ada
    if docker ps --filter "name=topshop_backend" -q | grep -q . ; then
        echo -e "  • Mematikan container Development (docker-compose.yml)..."
        docker compose down
    else
        # Fallback coba matikan keduanya dengan aman
        docker compose down 2>/dev/null || true
        docker compose -f docker-compose.prod.yml down 2>/dev/null || true
    fi
fi

echo -e "${GREEN}✅ Semua service berhasil dimatikan dengan aman.${NC}\n"
