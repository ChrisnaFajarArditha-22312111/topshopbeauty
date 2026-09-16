#!/usr/bin/env bash
# ==============================================================================
# logs.sh — Menampilkan Live Log Output dari Backend FastAPI (Local & VPS)
# Tekan Ctrl+C untuk keluar.
# ==============================================================================
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}${CYAN}📋 Menampilkan log backend (Tekan Ctrl+C untuk keluar)...${NC}\n"

if docker ps --filter "name=topshop_backend_prod" -q | grep -q . ; then
    docker compose -f docker-compose.prod.yml logs -f --tail=100 backend
else
    docker compose logs -f --tail=100 backend
fi
