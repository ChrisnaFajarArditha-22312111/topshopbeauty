@echo off
setlocal
cd /d "%~dp0.."
title Topshop Kosmetik - Lokal
if not exist ".env.production" (
    echo ERROR: File .env.production tidak ditemukan.
    goto :failed
)
where docker >nul 2>&1
if errorlevel 1 (
    echo ERROR: Pasang Docker Desktop terlebih dahulu.
    goto :failed
)
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Buka Docker Desktop dan tunggu sampai siap, lalu coba lagi.
    goto :failed
)
docker compose version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Compose belum tersedia. Periksa instalasi Docker Desktop.
    goto :failed
)
where node >nul 2>&1
if errorlevel 1 (
    echo ERROR: Pasang Node.js 22 LTS, lalu buka ulang CMD.
    goto :failed
)
where npm >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm tidak ditemukan. Periksa instalasi Node.js.
    goto :failed
)
echo [1/3] Menjalankan backend dan database...
docker compose --env-file .env.production -f docker-compose.yml up -d --build
if errorlevel 1 goto :failed
echo [2/3] Memperbarui struktur database...
docker compose --env-file .env.production -f docker-compose.yml exec -T backend alembic upgrade head
if errorlevel 1 goto :failed
cd /d "%~dp0..\frontend"
if not exist "node_modules\next\package.json" (
    echo Memasang dependensi frontend. Proses pertama membutuhkan internet...
    call npm ci
    if errorlevel 1 goto :failed
)
echo [3/3] Menjalankan frontend...
echo.
echo Buka http://localhost:3000 setelah frontend berstatus Ready.
echo Untuk database baru, jalankan seed.bat melalui CMD kedua.
echo Tekan Ctrl+C untuk menghentikan frontend.
echo Backend tetap berjalan di Docker. Gunakan stop.bat untuk menghentikannya.
echo.
call npm run dev
if errorlevel 1 goto :failed
exit /b 0
:failed
echo.
echo Proses gagal. Periksa pesan kesalahan di atas.
pause
exit /b 1
