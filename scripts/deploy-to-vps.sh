#!/bin/bash
# =========================================================
# deploy-to-vps.sh — Script Deployment Topshop Kosmetik AI
# Upload project dari lokal ke VPS via rsync + setup otomatis
# =========================================================

set -euo pipefail

# -------------------------------------------------------
# KONFIGURASI VPS
# -------------------------------------------------------
VPS_HOST="202.155.16.177"
VPS_PORT="22"
VPS_USER="casper"
VPS_APP_DIR="/opt/topshop-kosmetik"
LOCAL_PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Warna output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
log_step()    { echo -e "\n${CYAN}══════════════════════════════════════${NC}"; echo -e "${CYAN}  STEP: $1${NC}"; echo -e "${CYAN}══════════════════════════════════════${NC}"; }

SSH_CMD="ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no -o BatchMode=yes"

# -------------------------------------------------------
# CEK KONEKSI VPS
# -------------------------------------------------------
log_step "Memeriksa koneksi ke VPS ${VPS_HOST}..."
$SSH_CMD "${VPS_USER}@${VPS_HOST}" "echo 'Koneksi berhasil!'" || \
    log_error "Tidak bisa terhubung ke VPS. Pastikan SSH key sudah diupload."
log_success "Koneksi VPS berhasil (via SSH key)."

# -------------------------------------------------------
# STEP 1: CEK FILE .env.production
# -------------------------------------------------------
log_step "Memeriksa file .env.production..."
ENV_PROD_FILE="${LOCAL_PROJECT_DIR}/.env.production"
[ -f "${ENV_PROD_FILE}" ] || log_error "File .env.production tidak ditemukan di: ${ENV_PROD_FILE}"
log_success "File .env.production ditemukan."

# -------------------------------------------------------
# STEP 2: INSTALL DOCKER DI VPS
# -------------------------------------------------------
log_step "Memeriksa & menginstall Docker di VPS..."

$SSH_CMD "${VPS_USER}@${VPS_HOST}" bash << 'REMOTE_INSTALL'
set -e

if command -v docker &>/dev/null; then
    echo "[OK] Docker sudah terinstall: $(docker --version)"
else
    echo "[INFO] Menginstall Docker..."
    sudo apt-get update -y -qq
    sudo apt-get install -y ca-certificates curl gnupg -qq
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    sudo usermod -aG docker $USER
    echo "[OK] Docker berhasil diinstall."
fi

if docker compose version &>/dev/null 2>&1; then
    echo "[OK] Docker Compose tersedia: $(docker compose version)"
else
    echo "[INFO] Menginstall Docker Compose plugin..."
    sudo apt-get install -y docker-compose-plugin -qq
    echo "[OK] Docker Compose terinstall."
fi

sudo systemctl enable docker --now 2>/dev/null || true
echo "[OK] Docker service aktif."
REMOTE_INSTALL

log_success "Docker siap di VPS."

# -------------------------------------------------------
# STEP 3: BUAT DIREKTORI APP DI VPS
# -------------------------------------------------------
log_step "Menyiapkan direktori aplikasi di VPS..."
$SSH_CMD "${VPS_USER}@${VPS_HOST}" \
    "sudo mkdir -p ${VPS_APP_DIR} && sudo chown -R \${USER}:\${USER} ${VPS_APP_DIR}"
log_success "Direktori ${VPS_APP_DIR} siap."

# -------------------------------------------------------
# STEP 4: UPLOAD PROJECT KE VPS
# -------------------------------------------------------
log_step "Mengupload project ke VPS via rsync..."
log_info "Source : ${LOCAL_PROJECT_DIR}"
log_info "Target : ${VPS_USER}@${VPS_HOST}:${VPS_APP_DIR}"

EXCLUDE_FILE="/tmp/topshop-rsync-exclude"
cat > "${EXCLUDE_FILE}" << 'EOF'
.git/
backend/venv/
backend/__pycache__/
backend/.pytest_cache/
backend/tests/
backend/*.pyc
backend/products.json
frontend/node_modules/
frontend/.next/
frontend/.git/
frontend/tsconfig.tsbuildinfo
*.log
*.tmp
.DS_Store
EOF

rsync -avz --progress \
    -e "ssh -p ${VPS_PORT} -o StrictHostKeyChecking=no" \
    --exclude-from="${EXCLUDE_FILE}" \
    --delete \
    "${LOCAL_PROJECT_DIR}/" \
    "${VPS_USER}@${VPS_HOST}:${VPS_APP_DIR}/"

rm -f "${EXCLUDE_FILE}"
log_success "Project berhasil diupload."

# -------------------------------------------------------
# STEP 5: BUILD & JALANKAN CONTAINER DI VPS
# -------------------------------------------------------
log_step "Build & jalankan Docker containers di VPS..."

$SSH_CMD "${VPS_USER}@${VPS_HOST}" bash << REMOTE_BUILD
set -e
cd "${VPS_APP_DIR}"

echo "[INFO] Working dir: \$(pwd)"

[ -f ".env.production" ] || { echo "[ERROR] .env.production tidak ada!"; exit 1; }
echo "[OK] .env.production ditemukan."

# Tambahkan user ke grup docker jika belum (tanpa perlu re-login)
if ! groups | grep -q docker; then
    sudo usermod -aG docker \$USER
    # Jalankan docker dengan sudo untuk sesi ini
    DOCKER_CMD="sudo docker"
else
    DOCKER_CMD="docker"
fi

echo "[INFO] Menghentikan container lama..."
\$DOCKER_CMD compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

echo "[INFO] Building & starting containers (ini memakan waktu beberapa menit)..."
\$DOCKER_CMD compose -f docker-compose.prod.yml up -d --build

echo "[INFO] Menunggu semua service siap (45 detik)..."
sleep 45

echo "[INFO] Status container:"
\$DOCKER_CMD compose -f docker-compose.prod.yml ps

echo "[INFO] Menjalankan database migration..."
\$DOCKER_CMD exec topshop_backend_prod alembic upgrade head && \
    echo "[OK] Migration berhasil!" || \
    echo "[WARN] Migration gagal atau sudah up-to-date."

echo ""
echo "✅ Deployment di VPS selesai!"
REMOTE_BUILD

# -------------------------------------------------------
# STEP 6: VERIFIKASI
# -------------------------------------------------------
log_step "Verifikasi deployment..."
sleep 5

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 15 \
    "http://${VPS_HOST}/health" 2>/dev/null || echo "000")

if [ "${HTTP_STATUS}" = "200" ]; then
    log_success "✅ Backend API ONLINE! HTTP ${HTTP_STATUS}"
else
    log_warn "Health check: HTTP ${HTTP_STATUS} (mungkin masih startup)"
fi

log_info "Log backend (20 baris terakhir):"
echo "---"
$SSH_CMD "${VPS_USER}@${VPS_HOST}" \
    "cd ${VPS_APP_DIR} && (docker compose -f docker-compose.prod.yml logs --tail=20 backend 2>/dev/null || sudo docker compose -f docker-compose.prod.yml logs --tail=20 backend)"

# -------------------------------------------------------
# RINGKASAN
# -------------------------------------------------------
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     DEPLOYMENT SELESAI! 🚀               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}API Base URL  :${NC} http://${VPS_HOST}"
echo -e "  ${CYAN}Health Check  :${NC} http://${VPS_HOST}/health"
echo -e "  ${CYAN}API Docs      :${NC} http://${VPS_HOST}/docs"
echo -e "  ${CYAN}App Dir VPS   :${NC} ${VPS_APP_DIR}"
echo ""
echo -e "  ${YELLOW}Perintah berguna (SSH ke VPS):${NC}"
echo -e "  ssh ${VPS_USER}@${VPS_HOST}"
echo -e "  cd ${VPS_APP_DIR}"
echo -e "  sudo docker compose -f docker-compose.prod.yml ps"
echo -e "  sudo docker compose -f docker-compose.prod.yml logs -f backend"
echo ""
