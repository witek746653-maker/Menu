@echo off
cd /d %~dp0
echo ================================
echo   🚀 Запускаю локальный сервер...
echo ================================
start "" cmd /k "python server.py"
timeout /t 2 >nul
start "" http://localhost:8000/menus/waiter-database.html
pause
