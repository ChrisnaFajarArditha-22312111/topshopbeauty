@echo off
setlocal
cd /d "%~dp0.."
title Topshop Kosmetik - Data Awal
echo Gunakan hanya untuk database lokal baru.
echo Script ini membuat atau memperbarui akun contoh dan katalog.
echo Jalankan start.bat terlebih dahulu.
echo.
choice /c YN /n /m "Lanjutkan pengisian data contoh? [Y/N]: "
if errorlevel 2 exit /b 0
if errorlevel 1 goto :seed
exit /b 1
:seed
docker compose --env-file .env.production -f docker-compose.yml exec -T backend python seed_dev_data.py
if errorlevel 1 (
    echo ERROR: Pengisian data gagal. Pastikan backend sudah berjalan.
    pause
    exit /b 1
)
echo.
echo Data contoh selesai diisi.
pause
exit /b 0
