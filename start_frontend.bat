@echo off
echo ========================================================
echo Starting Smart Infrastructure Digital Twin - Frontend UI
echo ========================================================
cd /d "%~dp0frontend"
npm run dev -- --port 3000
pause
