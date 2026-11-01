@echo off
setlocal enabledelayedexpansion

echo =======================================================================
echo   108 EMERGENCY AMBULANCE DISPATCH SYSTEM - JAVA BACKEND
echo   Perundurai & Erode District Hub (Tamil Nadu)
echo   MySQL Database Connectivity (smart_emergency_ambulance_dispatcher)
echo =======================================================================
cd /d "%~dp0"

REM 1. Detect javac / java
set "JAVAC_CMD=javac"
set "JAVA_CMD=java"

where javac >nul 2>nul
if errorlevel 1 (
    for /d %%D in ("C:\Program Files\Java\jdk*") do (
        if exist "%%D\bin\javac.exe" (
            set "JAVAC_CMD=%%D\bin\javac.exe"
            set "JAVA_CMD=%%D\bin\java.exe"
        )
    )
)

if not exist "backend-java\bin" mkdir "backend-java\bin"

REM Free port 8001 if already in use by a previous instance
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001 ^| findstr LISTENING 2^>nul') do (
    echo [INFO] Releasing port 8001 (Stopping PID %%a)...
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo [1/2] Compiling Java Backend with MySQL JDBC Connector...
"%JAVAC_CMD%" -encoding UTF-8 -cp "backend-java/lib/*" -d backend-java/bin backend-java/src/com/ambulance108/*.java

if errorlevel 1 (
    echo.
    echo [ERROR] Compilation failed. Please check the Java compiler output above.
    pause
    exit /b 1
)

echo [2/2] Compilation successful. Starting Java Backend Server...
echo.
"%JAVA_CMD%" -Dfile.encoding=UTF-8 -cp "backend-java/bin;backend-java/lib/*" com.ambulance108.Server

pause
