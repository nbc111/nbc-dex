# 临时修改 PATH，将 nvm 的 Node 16.17.0 放在最前面
$env:Path = "D:\Nvm\nvm\v16.17.0;D:\Nvm\nvm\v16.17.0\node_modules\npm\bin;" + $env:Path

# 验证 Node 版本
Write-Host "Using Node version:" -ForegroundColor Green
node --version

# 启动项目
npm start
