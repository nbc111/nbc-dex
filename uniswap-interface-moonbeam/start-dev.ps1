# 设置 Node.js 环境变量以解决 OpenSSL 错误
$env:NODE_OPTIONS = "--openssl-legacy-provider"

Write-Host "Starting Moonbeam Uniswap with Node.js OpenSSL legacy provider..." -ForegroundColor Green
Write-Host "NODE_OPTIONS = $env:NODE_OPTIONS" -ForegroundColor Yellow

# 启动开发服务器
npm start
