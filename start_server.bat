@echo off
cd /d %~dp0
echo ================================
echo   🚀 Запускаю локальный сервер...
echo ================================
start "" python -m http.server 8000
timeout /t 2 >nul
start "" http://localhost:8000/index.html
pause
