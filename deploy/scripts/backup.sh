#!/bin/bash
# =========================================================
# backup.sh — Skrip Otomatis Backup Database PostgreSQL
# Sesuai PRD Topshop Kosmetik AI
# Jalankan via crontab: 0 2 * * * /path/to/deploy/scripts/backup.sh
# =========================================================

set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/topshop}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="topshop_db_backup_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="${POSTGRES_CONTAINER:-topshop_postgres_prod}"
DB_USER="${POSTGRES_USER:-topshop_admin}"
DB_NAME="${POSTGRES_DB:-topshop_production_db}"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Memulai proses backup database: ${DB_NAME}..."

# Eksekusi pg_dump via docker container lalu kompresi gzip
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "${BACKUP_DIR}/${BACKUP_FILENAME}"

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILENAME}" | cut -f1)
echo "[$(date)] Backup selesai: ${BACKUP_DIR}/${BACKUP_FILENAME} (${BACKUP_SIZE})"

# Hapus backup yang lebih lama dari retention days (14 hari)
echo "[$(date)] Membersihkan file backup lebih lama dari ${RETENTION_DAYS} hari..."
find "$BACKUP_DIR" -name "topshop_db_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "[$(date)] Seluruh proses backup berhasil!"
