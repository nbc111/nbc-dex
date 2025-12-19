@echo off
echo ========================================
echo Starting development server with full output
echo ========================================
cd /d "%~dp0"
set NODE_OPTIONS=--openssl-legacy-provider
set PORT=3001
set HOST=localhost
set DISABLE_ESLINT_PLUGIN=true
set CI=true
echo Environment variables:
echo   NODE_OPTIONS=%NODE_OPTIONS%
echo   PORT=%PORT%
echo   HOST=%HOST%
echo   DISABLE_ESLINT_PLUGIN=%DISABLE_ESLINT_PLUGIN%
echo   CI=%CI%
echo.
echo Starting npm start...
echo Please wait for compilation (this may take 2-3 minutes)...
echo Look for "Compiled successfully!" message.
echo.
echo If you see "Failed to compile", please copy the error message.
echo.
npm start

