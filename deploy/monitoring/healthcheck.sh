#!/bin/bash
# =========================================================
# healthcheck.sh — Skrip Monitoring & Self-Healing Service
# Memeriksa respons HTTP /health dan restart otomatis jika service down
# Jalankan via crontab: */5 * * * * /path/to/deploy/monitoring/healthcheck.sh
# =========================================================

HEALTH_URL="http://localhost/health"
MAX_ATTEMPTS=3
LOG_FILE="/var/log/topshop_healthcheck.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

attempt=1
success=false

while [ $attempt -le $MAX_ATTEMPTS ]; do
    status_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" || echo "000")
    if [ "$status_code" -eq 200 ]; then
        success=true
        break
    else
        log "WARNING: Percobaan $attempt - Endpoint $HEALTH_URL mengembalikan status: $status_code"
        sleep 2
        ((attempt++))
    fi
done

if [ "$success" = true ]; then
    log "INFO: Topshop Kosmetik API berjalan normal (200 OK)."
else
    log "CRITICAL: Service tidak merespons setelah $MAX_ATTEMPTS kali percobaan! Merestart container backend..."
    docker restart topshop_backend_prod
    log "INFO: Container topshop_backend_prod telah direstart."
fi
