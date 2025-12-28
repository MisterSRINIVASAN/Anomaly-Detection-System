@echo off
title Anomaly Detection System Startup
color 0b

:: Store the root directory
set "ROOT_DIR=%~dp0"

echo =======================================================
echo    Real-Time Anomaly Detection System Startup
echo =======================================================

echo.
echo [1] Setting up Python Backend...
cd /d "%ROOT_DIR%backend"
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
echo Activating virtual environment and installing requirements...
call venv\Scripts\activate
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies!
    pause
    exit /b
)

echo.
echo [2] Starting FastAPI Backend on Port 8000...
:: Start from backend directory directly
start "Anomaly Backend" cmd /k "title Anomaly Backend && call venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo.
echo [3] Setting up React Frontend...
cd /d "%ROOT_DIR%frontend"
echo Installing npm dependencies (this may take a moment)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies!
    pause
    exit /b
)

echo.
echo [4] Starting Vite Frontend...
:: Start from frontend directory directly
start "Anomaly Frontend" cmd /k "title Anomaly Frontend && npm run dev"

echo.
echo =======================================================
echo    All services are starting! 
echo    Check the separate windows for Backend and Frontend.
echo =======================================================
echo.
echo Backend API: http://localhost:8000
echo Frontend UI: Check Vite output (usually http://localhost:5173)
echo.
cd /d "%ROOT_DIR%"
pause

