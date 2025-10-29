@echo off
echo DataForEarth Agent - Windows Service Uninstaller
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires administrator privileges.
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo Uninstalling DataForEarth Agent service...
echo.

schtasks /delete /tn "DataForEarth Agent" /f

if %errorLevel% equ 0 (
    echo.
    echo ============================================
    echo Service uninstalled successfully!
    echo ============================================
    echo.
    echo The agent will no longer start automatically on login.
    echo You can still run it manually from the Start Menu or desktop shortcut.
    echo.
) else (
    echo.
    echo Service was not found or already removed.
    echo.
)

pause
