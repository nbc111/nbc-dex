@echo off
echo ========================================
echo 正在启动开发服务器...
echo ========================================
cd /d "%~dp0"
set NODE_OPTIONS=--openssl-legacy-provider
set PORT=3001
set DISABLE_ESLINT_PLUGIN=true
echo 环境变量已设置:
echo   NODE_OPTIONS=%NODE_OPTIONS%
echo   PORT=%PORT%
echo   DISABLE_ESLINT_PLUGIN=%DISABLE_ESLINT_PLUGIN%
echo.
echo 正在启动服务...
echo.
npm start

