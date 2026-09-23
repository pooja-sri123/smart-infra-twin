@echo off
echo ========================================================
echo Launching Smart Infrastructure Digital Twin Full-Stack
echo ========================================================
start "Smart Infra Twin - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn main:app --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul
start "Smart Infra Twin - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 3000"
echo System launching at http://localhost:3000
