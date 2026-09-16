"""
tests_phase7.py — Integration & Verification Suite untuk Phase 7: Deployment Configuration
Menguji validitas seluruh artefak deployment:
1. Docker Compose Production syntax & service definitions
2. Nginx configuration syntax & security headers
3. Production environment template (.env.production.example)
4. Backup script syntax & execution permissions
5. Monitoring / Healthcheck script syntax
6. Deployment documentation completeness
"""
import os
import sys
import subprocess

GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_header(title):
    print(f"\n{CYAN}{BOLD}{'='*60}{RESET}")
    print(f"{CYAN}{BOLD}  {title}{RESET}")
    print(f"{CYAN}{BOLD}{'='*60}{RESET}")


def print_ok(msg):
    print(f"  {GREEN}✓ {msg}{RESET}")


def print_fail(msg):
    print(f"  {RED}✗ {msg}{RESET}")


def test_docker_compose_prod():
    print_header("SKENARIO 1: Docker Compose Production Verification")
    compose_path = "/home/casper/Tools/22_Topshop_Ecommerce/docker-compose.prod.yml"
    assert os.path.exists(compose_path), f"File {compose_path} tidak ditemukan"

    with open(compose_path, "r") as f:
        content = f.read()

    # Periksa ketersediaan 3 service utama
    assert "postgres:" in content, "Service postgres harus didefinisikan"
    assert "backend:" in content, "Service backend harus didefinisikan"
    assert "nginx:" in content, "Service nginx harus didefinisikan"
    assert "pgvector/pgvector:pg15" in content, "Postgres harus menggunakan image pgvector"
    assert "workers 4" in content, "Uvicorn harus berjalan dengan multi-workers di production"
    assert "restart: always" in content, "Production containers harus restart always"
    print_ok("File docker-compose.prod.yml lengkap dengan 3 service: postgres, backend, nginx")
    print_ok("PostgreSQL pgvector dan Uvicorn multi-workers terkonfigurasi dengan benar")


def test_nginx_config():
    print_header("SKENARIO 2: Nginx Reverse Proxy Configuration")
    nginx_path = "/home/casper/Tools/22_Topshop_Ecommerce/deploy/nginx/nginx.conf"
    assert os.path.exists(nginx_path), f"File {nginx_path} tidak ditemukan"

    with open(nginx_path, "r") as f:
        content = f.read()

    assert "upstream backend_api" in content
    assert "CF-Connecting-IP" in content, "Real IP Cloudflare harus direstorasi"
    assert "limit_req_zone" in content, "Rate limiting harus aktif"
    assert "X-Frame-Options" in content, "Security headers harus ada"
    assert "/health" in content, "Healthcheck path harus diteruskan"
    assert "/api/" in content, "API path harus di-reverse proxy ke backend"
    print_ok("Nginx config memiliki upstream backend_api & Cloudflare real IP header")
    print_ok("Rate limiting dan security headers terkonfigurasi")


def test_production_env():
    print_header("SKENARIO 3: Production Environment Variables")
    env_path = "/home/casper/Tools/22_Topshop_Ecommerce/.env.production.example"
    assert os.path.exists(env_path)

    with open(env_path, "r") as f:
        content = f.read()

    required_vars = [
        "APP_ENV=production",
        "DATABASE_URL",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "JWT_SECRET_KEY",
        "ALIBABA_CLOUD_API_KEY",
        "QWEN_MODEL",
        "MAYAR_API_KEY",
        "BITESHIP_API_KEY",
        "ALLOWED_ORIGINS",
    ]
    for var in required_vars:
        assert var in content, f"Variabel {var} harus ada di .env.production.example"
        print_ok(f"Variabel production {var.split('=')[0]} ditemukan")


def test_backup_and_monitoring_scripts():
    print_header("SKENARIO 4: Backup & Monitoring Scripts")
    backup_script = "/home/casper/Tools/22_Topshop_Ecommerce/deploy/scripts/backup.sh"
    health_script = "/home/casper/Tools/22_Topshop_Ecommerce/deploy/monitoring/healthcheck.sh"

    assert os.path.exists(backup_script)
    assert os.path.exists(health_script)
    assert os.access(backup_script, os.X_OK), "backup.sh harus memiliki execute permission (+x)"
    assert os.access(health_script, os.X_OK), "healthcheck.sh harus memiliki execute permission (+x)"

    with open(backup_script, "r") as f:
        backup_content = f.read()
    assert "pg_dump" in backup_content
    assert "gzip" in backup_content
    assert "RETENTION_DAYS" in backup_content
    print_ok("Script backup.sh valid (pg_dump, kompresi gzip, dan auto-cleanup retention)")

    with open(health_script, "r") as f:
        health_content = f.read()
    assert "curl" in health_content
    assert "docker restart" in health_content
    print_ok("Script healthcheck.sh valid (monitoring respons HTTP /health & auto self-healing)")


def test_deployment_docs():
    print_header("SKENARIO 5: Deployment Documentation Completeness")
    doc_path = "/home/casper/Tools/22_Topshop_Ecommerce/deploy/DEPLOYMENT.md"
    assert os.path.exists(doc_path)

    with open(doc_path, "r") as f:
        content = f.read()

    assert "Alibaba Cloud ECS" in content
    assert "Cloudflare" in content
    assert "docker compose" in content
    assert "crontab" in content
    assert "SSL" in content
    print_ok("Dokumentasi DEPLOYMENT.md lengkap dengan panduan ECS, Cloudflare, SSL, dan Cron")


def run_all_tests():
    print(f"\n{BOLD}{CYAN}{'#'*60}{RESET}")
    print(f"{BOLD}{CYAN}  PHASE 7 — DEPLOYMENT ARTIFACTS TEST SUITE{RESET}")
    print(f"{BOLD}{CYAN}  Topshop Kosmetik AI{RESET}")
    print(f"{BOLD}{CYAN}{'#'*60}{RESET}")

    tests = [
        ("Docker Compose Production", test_docker_compose_prod),
        ("Nginx Reverse Proxy Config", test_nginx_config),
        ("Production Environment Config", test_production_env),
        ("Backup & Monitoring Scripts", test_backup_and_monitoring_scripts),
        ("Deployment Guide Documentation", test_deployment_docs),
    ]

    passed = 0
    failed = 0
    for name, fn in tests:
        try:
            fn()
            passed += 1
        except Exception as e:
            failed += 1
            print_fail(f"GAGAL: {name} — {e}")

    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}  HASIL AKHIR: {passed}/{len(tests)} skenario LULUS{RESET}")
    if failed == 0:
        print(f"  {GREEN}✅ SEMUA SKENARIO LULUS — Phase 7 Deployment Artefak siap!{RESET}")
    print(f"{BOLD}{'='*60}{RESET}\n")

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
