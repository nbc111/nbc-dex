# PowerShell 启动脚本
Write-Host "========================================"
Write-Host "正在启动开发服务器..."
Write-Host "========================================"

$env:NODE_OPTIONS="--openssl-legacy-provider"
$env:PORT="3001"
$env:HOST="localhost"
$env:DISABLE_ESLINT_PLUGIN="true"

Write-Host "环境变量已设置:"
Write-Host "  NODE_OPTIONS=$env:NODE_OPTIONS"
Write-Host "  PORT=$env:PORT"
Write-Host "  HOST=$env:HOST"
Write-Host "  DISABLE_ESLINT_PLUGIN=$env:DISABLE_ESLINT_PLUGIN"
Write-Host ""
Write-Host "正在启动服务..."
Write-Host "请等待编译完成（可能需要1-2分钟）..."
Write-Host "服务将在 http://localhost:3001 启动"
Write-Host ""

npm start
