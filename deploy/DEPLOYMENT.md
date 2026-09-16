# 🚀 Panduan Deployment — Topshop Kosmetik AI

Panduan resmi langkah demi langkah deployment aplikasi Topshop Kosmetik AI pada **Alibaba Cloud ECS** dengan **Cloudflare DNS + SSL**.

---

## 🏗️ 1. Arsitektur Infrastruktur Production

```text
                  Users / Browser
                         │
                         ▼
             Cloudflare DNS & Proxy (Full SSL / HTTPS)
                         │ (Ports 80/443)
                         ▼
           Alibaba Cloud ECS (Ubuntu 22.04 / 24.04 LTS)
                         │
       ┌─────────────────┴─────────────────┐
       ▼                                   ▼
  Nginx Reverse Proxy              PostgreSQL 15 + pgvector
  (Rate Limit + Cache + IP)        (topshop_postgres_prod)
       │
       ▼
  FastAPI Backend (4 Workers)
  (topshop_backend_prod)
       │
  ┌────┴─────────────────────────────┐
  ▼              ▼                   ▼
Mayar API   Biteship API   Alibaba Qwen (DashScope)
```

---

## ☁️ 2. Persiapan Alibaba Cloud ECS Instance

1. **Spesifikasi Rekomendasi:**
   - **Instance Type:** `ecs.c7.large` (2 vCPU, 4 GiB RAM) atau minimal `ecs.t6-c1m2.large`
   - **Operating System:** Ubuntu 22.04 / 24.04 LTS 64-bit
   - **System Disk:** 40 GiB ESSD
   - **Security Group (Inbound Rules):**
     - Port `22` (SSH) — Batasi ke IP Admin
     - Port `80` (HTTP) — `0.0.0.0/0` (untuk traffic proxy Cloudflare)
     - Port `443` (HTTPS) — `0.0.0.0/0` (opsional jika direct SSL)

2. **Instalasi Docker & Docker Compose pada ECS:**
   ```bash
   # Update sistem
   sudo apt-get update && sudo apt-get upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER

   # Verifikasi instalasi
   docker --version
   docker compose version
   ```

---

## 🌐 3. Konfigurasi Cloudflare DNS & SSL

1. **Tambahkan Domain ke Cloudflare:**
   - Arahkan Nameserver domain registrar ke Nameserver Cloudflare yang diberikan.

2. **Pengaturan DNS Record:**
   | Type | Name | Content / Target | Proxy status |
   | :--- | :--- | :--- | :--- |
   | `A` | `@` | `<PUBLIC_IP_ALIBABA_ECS>` | Proxied (Orange Cloud) |
   | `A` | `www` | `<PUBLIC_IP_ALIBABA_ECS>` | Proxied (Orange Cloud) |
   | `A` | `api` | `<PUBLIC_IP_ALIBABA_ECS>` | Proxied (Orange Cloud) |

3. **Pengaturan SSL/TLS Cloudflare:**
   - **SSL/TLS Encryption Mode:** Pilih **Full** atau **Flexible** (jika Nginx ECS terminate di port 80).
   - **Always Use HTTPS:** Aktifkan (On).
   - **Automatic HTTPS Rewrites:** Aktifkan (On).
   - **Security Level:** Medium / High.

---

## 🚀 4. Menjalankan Aplikasi di ECS

1. **Clone Repository:**
   ```bash
   git clone https://github.com/your-username/topshop-kosmetik.git /opt/topshop-kosmetik
   cd /opt/topshop-kosmetik
   ```

2. **Setup File Environment Production:**
   ```bash
   cp .env.production.example .env.production
   nano .env.production
   ```
   *Isi secret key, password database, API Key DashScope Alibaba Cloud, Mayar, dan Biteship.*

3. **Generate Sertifikat SSL (untuk Direct IP / HTTPS):**
   ```bash
   ./deploy/scripts/generate-ssl.sh 202.155.16.177
   ```

4. **Build & Start Services:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

4. **Jalankan Database Migration (Alembic):**
   ```bash
   docker exec -it topshop_backend_prod alembic upgrade head
   ```

5. **Import Katalog Produk Awal (Opsional):**
   ```bash
   docker exec -it topshop_backend_prod python -m app.products.importer
   ```

---

## 🔄 5. Otomatisasi Backup & Monitoring

1. **Pasang Cron Job untuk Backup Harian:**
   ```bash
   sudo crontab -e
   ```
   Tambahkan baris berikut:
   ```bash
   # Backup database setiap jam 02:00 pagi
   0 2 * * * /opt/topshop-kosmetik/deploy/scripts/backup.sh >> /var/log/topshop_backup.log 2>&1

   # Monitoring & Auto-Restart service setiap 5 menit
   */5 * * * * /opt/topshop-kosmetik/deploy/monitoring/healthcheck.sh
   ```

---

## 🩺 6. Verifikasi & Pengujian Deployment

Periksa status container:
```bash
docker compose -f docker-compose.prod.yml ps
```

Uji respons backend:
```bash
# Uji HTTPS langsung ke IP (dengan self-signed cert):
curl -k https://202.155.16.177/health
# Output: {"status":"healthy","app":"Topshop Kosmetik AI","environment":"production"}

# Atau uji via domain / Cloudflare:
curl -I https://api.topshopbeauty.cloud/health
```
