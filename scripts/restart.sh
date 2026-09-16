#!/usr/bin/env bash
# ==============================================================================
# restart.sh — Merestart Service Backend FastAPI & Nginx (Local & VPS)
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'
BOLD='\033[1m'

echo -e "${BOLD}${CYAN}🔄 Merestart backend FastAPI...${NC}"

if docker ps --filter "name=topshop_backend_prod" -q | grep -q . || [[ "$*" == *"--prod"* ]]; then
    echo -e "  • Mode: PRODUCTION (VPS)"
    docker compose -f docker-compose.prod.yml restart backend nginx
else
    echo -e "  • Mode: DEVELOPMENT LOKAL"
    docker compose restart backend
fi

echo -e "${GREEN}✅ Service berhasil direstart.${NC}\n"
