@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."
title Topshop Kosmetik AI - Memulai...
cls

echo ============================================================
echo   TOPSHOP KOSMETIK AI - SISTEM STARTUP
echo ============================================================
echo.

REM ---- [LANGKAH 0] Auto-setup .env jika belum ada ----
if not exist ".env.production" (
    if exist ".env.example" (
        echo [SETUP] Menyalin .env.example ke .env.production...
        copy /y ".env.example" ".env.production" >nul
        echo [SETUP] PENTING: Buka .env.production dan isi SECRET_KEY, SUPABASE_URL, dll.
        echo [SETUP] Lanjut dengan nilai default untuk penggunaan lokal...
        echo.
    ) else (
        echo ERROR: File .env.production dan .env.example tidak ditemukan.
        echo         Hubungi administrator untuk mendapatkan file konfigurasi.
        goto :failed
    )
)

if not exist "frontend\.env.local" (
    if exist "frontend\.env.example" (
        echo [SETUP] Menyalin frontend\.env.example ke frontend\.env.local...
        copy /y "frontend\.env.example" "frontend\.env.local" >nul
        echo.
    )
)

REM ---- [LANGKAH 1] Cek dependensi wajib ----
echo [1/4] Memeriksa dependensi sistem...
where docker >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Docker Desktop belum terpasang.
    echo         Unduh dari: https://www.docker.com/products/docker-desktop
    goto :failed
)
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Docker Desktop belum berjalan.
    echo         Buka Docker Desktop dan tunggu hingga ikon di taskbar berstatus "Running",
    echo         lalu jalankan start.bat kembali.
    goto :failed
)
docker compose version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Docker Compose tidak tersedia. Periksa instalasi Docker Desktop Anda.
    goto :failed
)
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js belum terpasang.
    echo         Unduh Node.js 20 LTS dari: https://nodejs.org
    goto :failed
)
where npm >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: npm tidak ditemukan. Periksa instalasi Node.js.
    goto :failed
)
echo        OK - Semua dependensi tersedia.
echo.

REM ---- [LANGKAH 2] Jalankan backend + database via Docker ----
echo [2/4] Menjalankan backend dan database (Docker)...
docker compose --env-file .env.production -f docker-compose.yml up -d --build
if errorlevel 1 (
    echo.
    echo ERROR: Gagal menjalankan Docker container.
    echo         Jalankan "docker compose logs" untuk detail kesalahan.
    goto :failed
)
echo.
echo        Menunggu database siap menerima koneksi (6 detik)...
timeout /t 6 /nobreak >nul
echo        OK - Backend dan database berjalan.
echo.

REM ---- [LANGKAH 3] Migrasi database + Auto-Seed ----
echo [3/4] Memperbarui skema database...
docker compose --env-file .env.production -f docker-compose.yml exec -T backend alembic upgrade head
if errorlevel 1 (
    echo.
    echo [PERINGATAN] Migrasi gagal. Mencoba ulang setelah jeda 8 detik
    echo              (database mungkin masih dalam proses inisialisasi)...
    timeout /t 8 /nobreak >nul
    docker compose --env-file .env.production -f docker-compose.yml exec -T backend alembic upgrade head
    if errorlevel 1 (
        echo.
        echo ERROR: Migrasi database gagal dua kali.
        echo         Jalankan "docker compose logs backend" untuk detail kesalahan.
        goto :failed
    )
)
echo        OK - Skema database terkini.
echo.
echo        Memeriksa dan melengkapi data awal (admin, produk, embeddings)...
docker compose --env-file .env.production -f docker-compose.yml exec -T backend python init_and_seed.py
if errorlevel 1 (
    echo.
    echo [PERINGATAN] Auto-seed gagal atau dilewati.
    echo              Jalankan seed.bat secara manual jika data produk belum muncul.
)
echo        OK - Database siap.
echo.

REM ---- [LANGKAH 4] Frontend ----
echo [4/4] Menyiapkan dan menjalankan frontend...
cd /d "%~dp0..\frontend"
if not exist "node_modules\next\package.json" (
    echo.
    echo        Memasang dependensi frontend (pertama kali ^| butuh internet ~1-3 menit)...
    call npm ci
    if errorlevel 1 (
        echo        npm ci gagal. Mencoba npm install (mode fallback)...
        call npm install
        if errorlevel 1 (
            echo.
            echo ERROR: Gagal memasang dependensi frontend.
            echo         Pastikan koneksi internet aktif, lalu coba lagi.
            goto :failed
        )
    )
    echo        OK - Dependensi frontend terpasang.
    echo.
)

echo.
echo ============================================================
echo   SISTEM SIAP!
echo.
echo   Buka browser : http://localhost:3000
echo   Admin login  : admin@topshopbeauty.cloud / Admin123!
echo.
echo   Tekan Ctrl+C untuk menghentikan frontend.
echo   Gunakan stop.bat untuk menghentikan backend (Docker).
echo ============================================================
echo.
call npm run dev
if errorlevel 1 goto :failed
exit /b 0

:failed
echo.
echo ============================================================
echo   GAGAL MEMULAI SISTEM
echo   Periksa pesan kesalahan di atas, lalu coba lagi.
echo   Hubungi administrator jika masalah berlanjut.
echo ============================================================
echo.
pause
exit /b 1
