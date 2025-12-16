# PowerShell 启动脚本
Write-Host "========================================"
Write-Host "正在启动开发服务器..."
Write-Host "========================================"

$env:NODE_OPTIONS="--openssl-legacy-provider"
$env:PORT="3001"
$env:DISABLE_ESLINT_PLUGIN="true"

Write-Host "环境变量已设置:"
Write-Host "  NODE_OPTIONS=$env:NODE_OPTIONS"
Write-Host "  PORT=$env:PORT"
Write-Host "  DISABLE_ESLINT_PLUGIN=$env:DISABLE_ESLINT_PLUGIN"
Write-Host ""
Write-Host "正在启动服务..."
Write-Host ""

npm start
