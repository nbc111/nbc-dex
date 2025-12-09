# 启动开发服务器
$env:NODE_OPTIONS = "--openssl-legacy-provider"
$env:PORT = "3001"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Uniswap Interface" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Node Version: $(node --version)" -ForegroundColor Yellow
Write-Host "NPM Version: $(npm --version)" -ForegroundColor Yellow
Write-Host "Port: 3001" -ForegroundColor Yellow
Write-Host "URL: http://localhost:3001" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please wait for compilation to complete..." -ForegroundColor Green
Write-Host "This may take 1-2 minutes on first run." -ForegroundColor Yellow
Write-Host ""

npm start

