# PowerShell 脚本：快速创建流动性池
# 使用方法: .\scripts\create-pool.ps1

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         Moonbeam Uniswap DEX - 流动性池创建工具            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 检查是否安装了 Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ 错误: 未检测到 Node.js，请先安装 Node.js" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green

# 检查是否安装了 ethers
$ethersInstalled = npm list ethers 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  未检测到 ethers 包，正在安装..." -ForegroundColor Yellow
    npm install ethers
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ethers 安装失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ ethers 安装成功" -ForegroundColor Green
}

Write-Host ""
Write-Host "请选择操作模式:" -ForegroundColor Cyan
Write-Host "1. 创建单个池子（交互式）" -ForegroundColor White
Write-Host "2. 批量创建池子（使用预设配置）" -ForegroundColor White
Write-Host "3. 使用环境变量创建单个池子" -ForegroundColor White
Write-Host ""

$mode = Read-Host "请输入选项 (1/2/3)"

switch ($mode) {
    "1" {
        Write-Host "`n🔧 交互式创建单个池子" -ForegroundColor Cyan
        Write-Host "═".PadRight(60, "═") -ForegroundColor Gray
        Write-Host ""

        # 获取用户输入
        $privateKey = Read-Host "请输入私钥 (PRIVATE_KEY)" -AsSecureString
        $privateKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($privateKey)
        )

        $rpcUrl = Read-Host "RPC URL (默认: http://127.0.0.1:9944)"
        if ([string]::IsNullOrWhiteSpace($rpcUrl)) {
            $rpcUrl = "http://127.0.0.1:9944"
        }

        $chainId = Read-Host "Chain ID (默认: 1281)"
        if ([string]::IsNullOrWhiteSpace($chainId)) {
            $chainId = "1281"
        }

        Write-Host "`n可用的 Token 地址 (NBC 链):" -ForegroundColor Yellow
        Write-Host "NBC:  0x90b23532950f99cdcdcadeaf5f02435419e689e31ef3f716f04a6c5b1dfec9fa" -ForegroundColor White
        Write-Host "WBTC: 0x50e60f24cc3d0937df12516f518272ccbf1bec3445ed19621b5e4693f405b2ff" -ForegroundColor White
        Write-Host "WETH: 0x2aa707db25945e0803083db8c032b61bb957778f3f5fa12646f1e3f34ef56a95" -ForegroundColor White
        Write-Host "WSOL: 0xa4ca2a20a87cb88ff70ed5438f869e47c8fc0241e85ab4c1913e86f189674325" -ForegroundColor White
        Write-Host "WBNB: 0x89ce62e131e0d18f9f7162efe63bd6034f72c7a8a79cdb90106285bd2f70f811" -ForegroundColor White
        Write-Host ""

        $tokenA = Read-Host "Token A 地址"
        $tokenB = Read-Host "Token B 地址"
        $amountA = Read-Host "Token A 数量"
        $amountB = Read-Host "Token B 数量"
        
        $slippage = Read-Host "滑点容忍度 % (默认: 0.5)"
        if ([string]::IsNullOrWhiteSpace($slippage)) {
            $slippage = "0.5"
        }

        # 设置环境变量
        $env:PRIVATE_KEY = $privateKeyPlain
        $env:RPC_URL = $rpcUrl
        $env:CHAIN_ID = $chainId
        $env:TOKEN_A = $tokenA
        $env:TOKEN_B = $tokenB
        $env:AMOUNT_A = $amountA
        $env:AMOUNT_B = $amountB
        $env:SLIPPAGE = $slippage

        Write-Host "`n🚀 开始创建池子..." -ForegroundColor Green
        node scripts/createPool.js
    }
    
    "2" {
        Write-Host "`n🔧 批量创建池子" -ForegroundColor Cyan
        Write-Host "═".PadRight(60, "═") -ForegroundColor Gray
        Write-Host ""

        $privateKey = Read-Host "请输入私钥 (PRIVATE_KEY)" -AsSecureString
        $privateKeyPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($privateKey)
        )

        $rpcUrl = Read-Host "RPC URL (默认: http://127.0.0.1:9944)"
        if ([string]::IsNullOrWhiteSpace($rpcUrl)) {
            $rpcUrl = "http://127.0.0.1:9944"
        }

        $chainId = Read-Host "Chain ID (默认: 1281)"
        if ([string]::IsNullOrWhiteSpace($chainId)) {
            $chainId = "1281"
        }

        # 设置环境变量
        $env:PRIVATE_KEY = $privateKeyPlain
        $env:RPC_URL = $rpcUrl
        $env:CHAIN_ID = $chainId

        Write-Host "`n⚠️  警告: 这将创建多个池子，请确认您有足够的 token 余额！" -ForegroundColor Yellow
        $confirm = Read-Host "是否继续? (y/n)"
        
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Write-Host "`n🚀 开始批量创建池子..." -ForegroundColor Green
            node scripts/batchCreatePools.js
        } else {
            Write-Host "❌ 已取消" -ForegroundColor Red
        }
    }
    
    "3" {
        Write-Host "`n🔧 使用环境变量创建池子" -ForegroundColor Cyan
        Write-Host "═".PadRight(60, "═") -ForegroundColor Gray
        Write-Host ""
        Write-Host "请确保已设置以下环境变量:" -ForegroundColor Yellow
        Write-Host "  - PRIVATE_KEY" -ForegroundColor White
        Write-Host "  - RPC_URL (可选)" -ForegroundColor White
        Write-Host "  - CHAIN_ID (可选)" -ForegroundColor White
        Write-Host "  - TOKEN_A" -ForegroundColor White
        Write-Host "  - TOKEN_B" -ForegroundColor White
        Write-Host "  - AMOUNT_A" -ForegroundColor White
        Write-Host "  - AMOUNT_B" -ForegroundColor White
        Write-Host "  - SLIPPAGE (可选)" -ForegroundColor White
        Write-Host ""
        
        $confirm = Read-Host "是否继续? (y/n)"
        if ($confirm -eq "y" -or $confirm -eq "Y") {
            Write-Host "`n🚀 开始创建池子..." -ForegroundColor Green
            node scripts/createPool.js
        } else {
            Write-Host "❌ 已取消" -ForegroundColor Red
        }
    }
    
    default {
        Write-Host "❌ 无效的选项" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "═".PadRight(60, "═") -ForegroundColor Gray
Write-Host "✨ 脚本执行完成" -ForegroundColor Green
