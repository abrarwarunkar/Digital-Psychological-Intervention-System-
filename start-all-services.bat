@echo off
echo ============================================
echo Starting Student Mental Health System
echo ============================================
echo.

REM Check if we're in the right directory
if not exist "apps\api-server" (
    echo Error: Please run this script from the project root directory
    pause
    exit /b 1
)

echo [1/3] Starting Backend API Server...
start "Backend API" cmd /k "cd apps\api-server && npm run dev"
timeout /t 3 /nobreak > nul

echo [2/3] Starting Frontend (React)...
start "Frontend" cmd /k "cd apps\web-client && npm run dev"
timeout /t 3 /nobreak > nul

echo [3/3] Starting ML Service (Python)...
start "ML Service" cmd /k "cd ml\serving && python app.py"
timeout /t 2 /nobreak > nul

echo.
echo ============================================
echo All services are starting...
echo ============================================
echo.
echo Backend API:  http://localhost:5000
echo Frontend:     http://localhost:5173
echo ML Service:   http://localhost:8000
echo.
echo Press any key to exit this window...
pause > nul
