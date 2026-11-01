@echo off
echo =======================================================================
echo   108 EMERGENCY AMBULANCE DISPATCH SYSTEM
echo   Perundurai & Erode District, Tamil Nadu (TN-EMS)
echo   MySQL Database Active Backend
echo =======================================================================
echo.
echo 1. Launching Backend Server on http://localhost:8001 (Java Backend)...
start "108 Backend (Java)" cmd /k "cd /d "%~dp0" && run_backend.bat"

timeout /t 3 /nobreak >nul

echo 2. Launching Frontend Server on http://localhost:5173 ...
where npm >nul 2>nul
if errorlevel 1 (
    if exist "C:\Program Files\nodejs" set "PATH=C:\Program Files\nodejs;%PATH%"
    if exist "C:\Users\JAYASHRI\nodejs" set "PATH=C:\Users\JAYASHRI\nodejs;%PATH%"
)
start "108 Frontend (Vite)" cmd /k "cd /d "%~dp0\frontend" && npm run dev"

echo.
echo All services launched!
echo Open http://localhost:5173 in your browser to view the application.
echo Backend is running on Java + MySQL: http://localhost:8001/
echo.
pause
