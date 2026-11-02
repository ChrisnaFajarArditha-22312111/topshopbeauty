@echo off
setlocal
cd /d "%~dp0.."
docker compose --env-file .env.production -f docker-compose.yml down
if errorlevel 1 (
    echo ERROR: Gagal menghentikan container.
    pause
    exit /b 1
)
echo Backend dan database dihentikan. Data database tetap tersimpan.
echo Hentikan frontend dengan Ctrl+C pada jendela start.bat.
pause
exit /b 0
