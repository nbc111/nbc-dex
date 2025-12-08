# 白屏问题自动诊断脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Moonbeam Uniswap 白屏问题诊断工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 Node.js 版本
Write-Host "[1/7] 检查 Node.js 版本..." -ForegroundColor Yellow
$nodeVersion = node -v
Write-Host "   Node.js 版本: $nodeVersion" -ForegroundColor Green
if ($nodeVersion -like "v20*" -or $nodeVersion -like "v18*" -or $nodeVersion -like "v19*") {
    Write-Host "   ⚠️  警告: Node.js $nodeVersion 需要使用 --openssl-legacy-provider" -ForegroundColor Yellow
}
Write-Host ""

# 2. 检查端口占用
Write-Host "[2/7] 检查端口 3000 是否被占用..." -ForegroundColor Yellow
$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "   ✅ 端口 3000 正在监听" -ForegroundColor Green
    Write-Host "   进程 ID: $($port3000.OwningProcess)" -ForegroundColor Gray
} else {
    Write-Host "   ❌ 端口 3000 没有在监听" -ForegroundColor Red
    Write-Host "   开发服务器可能没有启动" -ForegroundColor Red
}
Write-Host ""

# 3. 检查 node_modules 是否存在
Write-Host "[3/7] 检查依赖是否已安装..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    $moduleCount = (Get-ChildItem "node_modules" -Directory).Count
    Write-Host "   ✅ node_modules 存在 ($moduleCount 个包)" -ForegroundColor Green
} else {
    Write-Host "   ❌ node_modules 不存在" -ForegroundColor Red
    Write-Host "   请运行: npm install --legacy-peer-deps" -ForegroundColor Red
}
Write-Host ""

# 4. 检查关键文件
Write-Host "[4/7] 检查关键文件..." -ForegroundColor Yellow
$files = @(
    "public/index.html",
    "src/index.tsx",
    "package.json"
)
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file 不存在" -ForegroundColor Red
    }
}
Write-Host ""

# 5. 检查 package.json 配置
Write-Host "[5/7] 检查 package.json 配置..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$startScript = $packageJson.scripts.start
Write-Host "   启动脚本: $startScript" -ForegroundColor Gray
if ($startScript -like "*openssl-legacy-provider*") {
    Write-Host "   ✅ 已配置 OpenSSL legacy provider" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  未配置 OpenSSL legacy provider" -ForegroundColor Yellow
}
Write-Host ""

# 6. 检查最近的 npm 日志
Write-Host "[6/7] 检查最近的 npm 错误日志..." -ForegroundColor Yellow
$logPath = "$env:LOCALAPPDATA\npm-cache\_logs"
if (Test-Path $logPath) {
    $latestLog = Get-ChildItem $logPath -Filter "*-debug-0.log" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($latestLog) {
        Write-Host "   最新日志: $($latestLog.Name)" -ForegroundColor Gray
        Write-Host "   时间: $($latestLog.LastWriteTime)" -ForegroundColor Gray
        $logContent = Get-Content $latestLog.FullName -Tail 10
        if ($logContent -match "ERR_OSSL_EVP_UNSUPPORTED") {
            Write-Host "   ❌ 发现 OpenSSL 错误" -ForegroundColor Red
        }
    }
}
Write-Host ""

# 7. 测试 localhost:3000
Write-Host "[7/7] 测试 http://localhost:3000 连接..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✅ 服务器响应正常 (状态码: $($response.StatusCode))" -ForegroundColor Green
    
    # 检查响应内容
    if ($response.Content -match '<div id="root">') {
        Write-Host "   ✅ HTML 包含 root 元素" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  HTML 不包含 root 元素" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ 无法连接到服务器" -ForegroundColor Red
    Write-Host "   错误: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 总结和建议
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  诊断完成 - 建议操作" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not $port3000) {
    Write-Host "🔧 步骤 1: 启动开发服务器" -ForegroundColor Yellow
    Write-Host "   运行: powershell -ExecutionPolicy Bypass -File start-dev.ps1" -ForegroundColor White
    Write-Host ""
}

Write-Host "🔍 步骤 2: 打开浏览器检查控制台" -ForegroundColor Yellow
Write-Host "   1. 访问 http://localhost:3000" -ForegroundColor White
Write-Host "   2. 按 F12 打开开发者工具" -ForegroundColor White
Write-Host "   3. 切换到 Console 标签" -ForegroundColor White
Write-Host "   4. 查看是否有红色错误信息" -ForegroundColor White
Write-Host ""

Write-Host "📋 步骤 3: 复制控制台错误信息" -ForegroundColor Yellow
Write-Host "   将浏览器控制台中的所有错误信息复制给我" -ForegroundColor White
Write-Host ""

Write-Host "💡 提示: 如果看到依赖错误，运行:" -ForegroundColor Cyan
Write-Host "   npm install --legacy-peer-deps" -ForegroundColor White
Write-Host ""
