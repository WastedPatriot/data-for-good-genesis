@echo off
echo DataForEarth Agent - Windows Service Installer
echo.

REM Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This script requires administrator privileges.
    echo Please right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo Installing DataForEarth Agent as Windows Service...
echo.

REM Get the program installation path
set "AGENT_PATH=%LOCALAPPDATA%\Programs\DataForEarth Agent\DataForEarth Agent.exe"

REM Check if portable version is being used
if not exist "%AGENT_PATH%" (
    echo ERROR: DataForEarth Agent not found in default location.
    echo.
    echo If you're using the portable version, please edit this script
    echo and update AGENT_PATH to point to your .exe location.
    pause
    exit /b 1
)

REM Create scheduled task for auto-startup
schtasks /create /tn "DataForEarth Agent" /tr "\"%AGENT_PATH%\"" /sc onlogon /rl highest /f

if %errorLevel% equ 0 (
    echo.
    echo ============================================
    echo Service installed successfully!
    echo ============================================
    echo.
    echo The agent will start automatically when you log in.
    echo You can also start it manually from the Start Menu.
    echo.
) else (
    echo.
    echo ERROR: Failed to create scheduled task.
    echo Please check Event Viewer for details.
    echo.
)

pause
