@echo off
REM ============================================================
REM SmartFlow AI Traffic Optimization
REM Docker Quick Start Script (Windows)
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  🚦 SmartFlow AI Traffic Optimization - Docker Setup      ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check Docker installation
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed!
    echo    Download: https://docker.com
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed!
    echo    Download: https://docker.com
    pause
    exit /b 1
)

echo ✅ Docker is installed
for /f "tokens=*" %%i in ('docker --version') do echo    Version: %%i
echo.

REM Ask user what to do
echo What would you like to do?
echo.
echo   1 - Start all services (recommended)
echo   2 - Build Docker images
echo   3 - View logs
echo   4 - Stop all services
echo   5 - Clean up everything
echo   6 - Run tests
echo   0 - Exit
echo.

set /p choice="Enter your choice (0-6): "

if "%choice%"=="1" goto start_services
if "%choice%"=="2" goto build_images
if "%choice%"=="3" goto view_logs
if "%choice%"=="4" goto stop_services
if "%choice%"=="5" goto cleanup
if "%choice%"=="6" goto run_tests
if "%choice%"=="0" goto exit_script
goto invalid_choice

:start_services
echo.
echo 🚀 Starting SmartFlow services with Docker Compose...
echo.
docker-compose up -d
echo.
echo ⏳ Waiting for services to start... (30 seconds)
timeout /t 30 /nobreak
echo.
echo ✅ Services started successfully!
echo.
echo 📍 Access the system:
echo    🌐 Frontend: http://localhost:8000
echo    🔧 Backend API: http://localhost:3000
echo    📊 Status: http://localhost:3000/status
echo    🏥 Health: http://localhost:3000/health
echo.
echo 💡 Next steps:
echo    1. Open http://localhost:8000 in your browser
echo    2. Click '▶ Start System'
echo    3. Toggle 'Smart AI Mode: ON'
echo    4. Watch efficiency increase!
echo.
echo 📜 View logs: docker-compose logs -f
echo ⏹️  Stop services: docker-compose down
echo.
goto end

:build_images
echo.
echo 🔨 Building Docker images (this may take 2-3 minutes)...
echo.
docker-compose build
echo.
echo ✅ Build complete!
echo    Next: Run 'docker-compose up -d' to start
echo.
goto end

:view_logs
echo.
echo 📜 Displaying live logs (Ctrl+C to exit)...
echo.
docker-compose logs -f --tail=50
goto end

:stop_services
echo.
echo 🛑 Stopping SmartFlow services...
docker-compose down
echo ✅ Services stopped!
echo.
goto end

:cleanup
echo.
echo 🧹 Cleaning up all Docker resources...
echo    This will remove containers, volumes, and images.
set /p confirm="Are you sure? (y/n): "

if /i "%confirm%"=="y" (
    docker-compose down -v
    echo ✅ Cleanup complete!
) else (
    echo ❌ Cleanup cancelled
)
echo.
goto end

:run_tests
echo.
echo 🧪 Running tests...
echo.

REM Check if services are running
docker ps | findstr "smartflow-backend" >nul 2>&1
if %errorlevel% neq 0 (
    echo ⏳ Starting services first...
    docker-compose up -d
    timeout /t 10 /nobreak
)

echo    Testing Backend Health...
for /f "tokens=*" %%i in ('curl -s http://localhost:3000/health 2^>nul ^| findstr "status"') do (
    echo        ✅ /health endpoint: OK
    goto test_traffic
)
echo        ❌ /health endpoint: FAILED

:test_traffic
echo    Testing Traffic API...
for /f "tokens=*" %%i in ('curl -s http://localhost:3000/traffic 2^>nul ^| findstr "totalCars"') do (
    echo        ✅ /traffic endpoint: OK
    goto test_status
)
echo        ❌ /traffic endpoint: FAILED

:test_status
echo    Testing Status API...
for /f "tokens=*" %%i in ('curl -s http://localhost:3000/status 2^>nul ^| findstr "running"') do (
    echo        ✅ /status endpoint: OK
    goto test_frontend
)
echo        ❌ /status endpoint: FAILED

:test_frontend
echo    Testing Frontend...
curl -s http://localhost:8000 2>nul | findstr "SmartFlow" >nul
if %errorlevel% equ 0 (
    echo        ✅ Frontend: OK
) else (
    echo        ❌ Frontend: FAILED
)

echo.
echo ✅ Tests complete!
echo.
goto end

:invalid_choice
echo.
echo ❌ Invalid choice. Please enter 0-6
echo.
goto end

:exit_script
echo.
echo 👋 Goodbye!
echo.
exit /b 0

:end
echo.
echo ℹ️  For more information:
echo    📖 Read: DOCKER_SETUP.md
echo    📖 Read: INTEGRATION_COMPLETE.md
echo    🎯 Run: make help (requires Make/WSL)
echo.
pause
