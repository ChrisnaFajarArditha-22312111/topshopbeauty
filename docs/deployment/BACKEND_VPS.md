# 🖥️ Panduan Deployment Backend di VPS (FastAPI + PostgreSQL + Docker)

Panduan lengkap instalasi dan konfigurasi backend **Topshop Kosmetik AI** pada server VPS Linux (Ubuntu 22.04 / 24.04 LTS) menggunakan **Docker**, **Docker Compose**, **PostgreSQL 15 + pgvector**, dan **Nginx Reverse Proxy**.

---

## 📋 1. Spesifikasi Server & Prasyarat

### Rekomendasi Spesifikasi VPS:
- **Provider:** Alibaba Cloud ECS, DigitalOcean, Hetzner, Linode, IDCloudHost, atau provider VPS lainnya.
- **CPU:** Minimal 2 vCPU (Rekomendasi 2-4 vCPU).
- **RAM:** Minimal 4 GB (agar komputasi embedding AI dan database stabil).
- **Penyimpanan:** 40 GB+ SSD / NVMe.
- **OS:** Ubuntu 22.04 LTS atau Ubuntu 24.04 LTS 64-bit.
- **Domain/Subdomain:** Subdomain terarah ke IP VPS (contoh: `api.topshopbeauty.cloud`).

### Port Inbound Firewall / Security Group:
| Port | Protokol | Sumber | Keterangan |
|---|---|---|---|
| `22` | TCP | IP Pribadi / `0.0.0.0/0` | Akses Remote SSH |
| `80` | TCP | `0.0.0.0/0` | HTTP (Let's Encrypt / Cloudflare) |
| `443` | TCP | `0.0.0.0/0` | HTTPS aman untuk API production |

---

## ⚙️ 2. Persiapan Server VPS Awal

Login ke VPS via SSH dari terminal lokal Anda:
```bash
ssh root@<IP_VPS_ANDA>
```

### A. Update dan Konfigurasi Dasar Sistem
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw fail2ban ca-certificates gnupg lsb-release
```

### B. Konfigurasi Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### C. Instalasi Docker & Docker Compose
```bash
# Hapus paket versi lama jika ada
sudo apt-get remove -y docker docker-engine docker.io containerd runc

# Pasang Docker resmi menggunakan script otomatis
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Berikan izin ke user non-root (opsional jika menggunakan non-root)
sudo usermod -aG docker $USER

# Verifikasi instalasi
docker --version
docker compose version
```

---

## 📦 3. Menyiapkan Proyek & Environment Production

### A. Clone Repositori
Tempatkan proyek di direktori standar `/opt` atau `/home`:
```bash
sudo mkdir -p /opt/topshop-kosmetik
cd /opt
sudo git clone https://github.com/<username>/<repo-topshop>.git topshop-kosmetik
cd /opt/topshop-kosmetik
```

### B. Konfigurasi File `.env.production`
Salin template konfigurasi production yang tersedia:
```bash
cp .env.production.example .env.production
nano .env.production
```

Sesuaikan nilai variabel berikut dengan kredensial server Anda:
```env
# ==============================================================================
# KONFIGURASI PRODUCTION BACKEND
# ==============================================================================
APP_ENV=production
APP_PORT=8000

# URL Frontend Vercel Anda (SANGAT PENTING untuk CORS)
FRONTEND_URL=https://topshopbeauty.cloud
ALLOWED_ORIGINS=https://topshopbeauty.cloud,https://www.topshopbeauty.cloud

# Database Credentials
POSTGRES_USER=topshop_prod_user
POSTGRES_PASSWORD=GantiDenganPasswordDatabaseSangatKuat123!
POSTGRES_DB=topshop_prod_db
DATABASE_URL=postgresql+asyncpg://topshop_prod_user:GantiDenganPasswordDatabaseSangatKuat123!@postgres:5432/topshop_prod_db

# Kunci Keamanan JWT (Generate string acak: openssl rand -hex 32)
JWT_SECRET_KEY=isi_dengan_hasil_openssl_rand_hex_32
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Integrasi AI Qwen (Alibaba Cloud DashScope)
AI_PROVIDER=alibaba
ALIBABA_CLOUD_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
QWEN_MODEL=qwen-plus

# Integrasi Payment Gateway (Mayar.id)
MAYAR_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAYAR_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Integrasi Kurir (Biteship)
BITESHIP_API_KEY=biteship_live.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Transaksional (SMTP)
SMTP_HOST=smtp.titan.email
SMTP_PORT=587
SMTP_USERNAME=mail@topshopbeauty.cloud
SMTP_PASSWORD=PasswordEmailSmtpAnda
SMTP_FROM_EMAIL=mail@topshopbeauty.cloud
SMTP_FROM_NAME="Topshop Kosmetik"

# Google OAuth (Opsional untuk login Google)
GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx
```

> [!WARNING]
> Jangan pernah membagikan atau meng-commit file `.env.production` ke repositori publik Git!

---

## 🚀 4. Menjalankan Backend (Otomatis: Build + Migrasi + Seeding)

Telah disediakan skrip otomatisasi [`scripts/start.sh`](file:///home/casper/Tools/22_Topshop_Ecommerce/scripts/start.sh) yang secara otomatis akan:
1. Menjalankan seluruh container Docker (`docker-compose.prod.yml`).
2. Menunggu status database & backend menjadi sehat (*healthy*).
3. **Menjalankan migrasi skema database (Alembic `upgrade head`) secara otomatis.**
4. **Menjalankan seeding data akun (`admin`, `customer`) dan mengimpor seluruh katalog produk dari `products.json` ke PostgreSQL.**

Cukup jalankan satu perintah:
```bash
./scripts/start.sh --prod
```

Periksa status container yang berjalan:
```bash
docker compose -f docker-compose.prod.yml ps
```
Pastikan ketiga container berikut berstatus **Up / Healthy**:
1. `topshop_postgres_prod` (PostgreSQL 15 + pgvector)
2. `topshop_backend_prod` (FastAPI 4 Workers)
3. `topshop_nginx_prod` (Reverse Proxy Nginx)

---

## 🗄️ 5. Perintah Manajemen Operasional (Scripts Helper)

Tersedia skrip pembantu di folder `scripts/` untuk mempermudah pemeliharaan harian di VPS:

```bash
# Merestart backend & nginx setelah update konfigurasi
./scripts/restart.sh

# Menghentikan seluruh service secara aman
./scripts/stop.sh

# Menjalankan ulang seeding data katalog produk sewaktu-waktu
./scripts/seed.sh

# Memantau live log output backend secara real-time
./scripts/logs.sh
```

---

## 🔒 6. Konfigurasi Domain & SSL HTTPS (Nginx & Certbot)

Agar API dapat diakses aman oleh frontend di Vercel (`https://api.topshopbeauty.cloud`), pasang sertifikat SSL.

### Opsi A: Menggunakan Cloudflare SSL (Direkomendasikan)
Jika domain dikelola di Cloudflare:
1. Buat DNS Record `A` untuk `api` mengarah ke IP Publik VPS Anda (`Proxied` aktif).
2. Di Cloudflare Dashboard, pilih **SSL/TLS** -> set ke **Full**.
3. Nginx bawaan docker akan menerima traffic di port 80 dan Cloudflare mengenkripsi lalu lintas publik secara otomatis.

### Opsi B: Menggunakan Let's Encrypt Certbot Langsung di Host VPS
Jika tidak menggunakan Cloudflare proxy:
```bash
# Pasang Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Hentikan port 80 sementara untuk verifikasi sertifikat standalone
docker compose -f docker-compose.prod.yml stop nginx

# Request sertifikat SSL
sudo certbot certonly --standalone -d api.topshopbeauty.cloud

# Pasang volume SSL di docker-compose atau buat konfigurasi Nginx host
```

---

## 🛠️ 7. Pemeliharaan, Backup & Monitoring

### A. Melihat Log Container (Real-Time)
```bash
# Log Backend FastAPI
docker logs -f topshop_backend_prod --tail 100

# Log Nginx Access & Error
docker logs -f topshop_nginx_prod --tail 100

# Log PostgreSQL
docker logs -f topshop_postgres_prod --tail 100
```

### B. Otomatisasi Backup Database Harian
Tersedia skrip backup otomatis di [`deploy/scripts/backup.sh`](file:///home/casper/Tools/22_Topshop_Ecommerce/deploy/scripts/backup.sh).
Jadwalkan via cron job:
```bash
sudo crontab -e
```
Tambahkan baris berikut di bagian bawah:
```cron
# Backup database otomatis setiap hari pukul 02.00 dini hari
0 2 * * * /opt/topshop-kosmetik/deploy/scripts/backup.sh >> /var/log/topshop_backup.log 2>&1

# Healthcheck & auto-restart setiap 5 menit jika service down
*/5 * * * * /opt/topshop-kosmetik/deploy/monitoring/healthcheck.sh
```

### C. Perintah Restart & Pembaruan Kode (CI/CD Manual)
Bila terdapat update kode di repository:
```bash
cd /opt/topshop-kosmetik
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build backend
docker exec -it topshop_backend_prod alembic upgrade head
```

---

## 🩺 8. Uji Coba Endpoint API

Pastikan backend merespon dengan benar dari luar server:
```bash
# Uji healthcheck backend
curl -I https://api.topshopbeauty.cloud/health

# Output yang diharapkan:
# HTTP/2 200 OK
# Content-Type: application/json
# {"status":"healthy"}
```
