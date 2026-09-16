#!/usr/bin/env bash
# ==============================================================================
# start.sh — Menjalankan Backend Topshop Kosmetik AI (Local & VPS Production)
# Fitur: Docker Compose + Healthcheck + Auto Migration (Alembic) + Auto Seeding
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

# Deteksi mode: Production (--prod / .env.production) atau Development Lokal
IS_PROD=false
if [[ "$*" == *"--prod"* ]] || [[ "$*" == *"-p"* ]] || [[ "$APP_ENV" == "production" ]]; then
    IS_PROD=true
elif [ -f .env.production ] && [ ! -f .env ]; then
    IS_PROD=true
fi

if [ "$IS_PROD" = true ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
    ENV_FILE=".env.production"
    BACKEND_CONTAINER="topshop_backend_prod"
    POSTGRES_CONTAINER="topshop_postgres_prod"
    MODE_LABEL="PRODUCTION (VPS)"
else
    COMPOSE_FILE="docker-compose.yml"
    ENV_FILE=".env"
    BACKEND_CONTAINER="topshop_backend"
    POSTGRES_CONTAINER="topshop_postgres"
    MODE_LABEL="DEVELOPMENT LOKAL"
fi

echo -e "${BOLD}${CYAN}==================================================================${NC}"
echo -e "${BOLD}${CYAN}  🛍️  MEMULAI BACKEND TOPSHOP KOSMETIK AI [${MODE_LABEL}]${NC}"
echo -e "${BOLD}${CYAN}==================================================================${NC}"

# 1. Periksa file Environment
if [ ! -f "$ENV_FILE" ]; then
    if [ "$IS_PROD" = true ] && [ -f .env.production.example ]; then
        echo -e "${YELLOW}⚠️  File .env.production tidak ditemukan. Menyalin dari .env.production.example...${NC}"
        cp .env.production.example .env.production
    elif [ -f .env.example ]; then
        echo -e "${YELLOW}⚠️  File .env tidak ditemukan. Menyalin dari .env.example...${NC}"
        cp .env.example .env
    else
        echo -e "${RED}❌ Error: File konfigurasi environment tidak ditemukan!${NC}"
        exit 1
    fi
fi

# Sinkronkan file env ke backend/.env jika belum ada
if [ ! -f backend/.env ]; then
    cp "$ENV_FILE" backend/.env
fi

# 2. Cek konflik port 5432 pada sistem host (khusus lokal)
if [ "$IS_PROD" = false ] && lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    if ! docker ps --filter "name=${POSTGRES_CONTAINER}" --filter "status=running" -q | grep -q . ; then
        echo -e "${YELLOW}⚠️  Port 5432 sedang digunakan oleh service lokal (misal: PostgreSQL host).${NC}"
        echo -e "${YELLOW}   Jika Docker gagal bind, jalankan: sudo systemctl stop postgresql${NC}"
    fi
fi

# 3. Jalankan container Docker
echo -e "\n${CYAN}📦 Menjalankan container Docker via ${COMPOSE_FILE}...${NC}"
docker compose -f "$COMPOSE_FILE" up -d --build

# 4. Tunggu container database & backend siap (healthcheck)
echo -e "\n${CYAN}⏳ Menunggu database & backend siap menerima koneksi...${NC}"
MAX_TRIES=35
COUNT=0
HEALTHY=false

while [ $COUNT -lt $MAX_TRIES ]; do
    BACKEND_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' "$BACKEND_CONTAINER" 2>/dev/null || echo "\"starting\"")
    POSTGRES_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' "$POSTGRES_CONTAINER" 2>/dev/null || echo "\"starting\"")

    if [ "$BACKEND_STATUS" = "\"healthy\"" ] && [ "$POSTGRES_STATUS" = "\"healthy\"" ]; then
        HEALTHY=true
        break
    fi

    COUNT=$((COUNT + 1))
    printf "."
    sleep 2
done
echo ""

if [ "$HEALTHY" = true ]; then
    echo -e "${GREEN}✅ Semua service container aktif dan sehat (healthy)!${NC}"
else
    echo -e "${YELLOW}⚠️  Waktu tunggu healthcheck berakhir, melanjutkan inisialisasi skema...${NC}"
fi

# 5. Eksekusi Migrasi Database Alembic
echo -e "\n${CYAN}🔄 [1/2] Menjalankan migrasi skema database (Alembic upgrade head)...${NC}"
docker exec "$BACKEND_CONTAINER" alembic upgrade head
echo -e "${GREEN}✅ Skema database PostgreSQL berhasil dimigrasi!${NC}"

# 6. Eksekusi Seeding Data Awal (Admin, Customer, & Katalog Produk)
echo -e "\n${CYAN}🌱 [2/2] Menjalankan Seeding Data Awal & Katalog Produk dari products.json...${NC}"
docker exec "$BACKEND_CONTAINER" python seed_dev_data.py
echo -e "${GREEN}✅ Seeding data akun, kategori, brand, & katalog produk selesai!${NC}"

# 7. Informasi Sukses & Panduan Akses
echo -e "\n${BOLD}${GREEN}==================================================================${NC}"
echo -e "${BOLD}${GREEN}  🚀 BACKEND BERHASIL AKTIF & SIAP DIGUNAKAN! [${MODE_LABEL}]${NC}"
echo -e "${BOLD}${GREEN}==================================================================${NC}"

if [ "$IS_PROD" = true ]; then
    echo -e "  • Production API : ${CYAN}https://api.topshopbeauty.cloud${NC}"
    echo -e "  • Health Check   : ${CYAN}https://api.topshopbeauty.cloud/health${NC}"
    echo -e "  • Nginx Proxy    : Port 80 / 443 (Aktif)"
else
    echo -e "  • Base API URL   : ${CYAN}http://localhost:8000${NC}"
    echo -e "  • Swagger UI Doc : ${CYAN}http://localhost:8000/api/docs${NC}"
    echo -e "  • ReDoc Doc      : ${CYAN}http://localhost:8000/api/redoc${NC}"
    echo -e "  • Health Check   : ${CYAN}http://localhost:8000/health${NC}"
fi

echo -e ""
echo -e "  🔑 Akun Akses Siap Pakai:"
echo -e "  • Admin          : admin@topshopbeauty.cloud / Admin123!"
echo -e "  • Customer       : customer@topshopbeauty.cloud / Customer123!"
echo -e ""
echo -e "  Perintah Tambahan:"
echo -e "  • Lihat Live Log : ${YELLOW}./scripts/logs.sh${NC}"
echo -e "  • Restart Service: ${YELLOW}./scripts/restart.sh${NC}"
echo -e "  • Matikan Server : ${YELLOW}./scripts/stop.sh${NC}"
echo -e "  • Re-run Seeding : ${YELLOW}./scripts/seed.sh${NC}"
echo -e "${BOLD}${GREEN}==================================================================${NC}\n"
