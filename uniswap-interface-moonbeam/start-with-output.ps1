# PowerShell script to start dev server with full output
Write-Host "========================================"
Write-Host "Starting development server with full output"
Write-Host "========================================"
Set-Location -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition)

$env:NODE_OPTIONS="--openssl-legacy-provider"
$env:PORT="3001"
$env:HOST="localhost"
$env:DISABLE_ESLINT_PLUGIN="true"
$env:CI="true"

Write-Host "Environment variables:"
Write-Host "  NODE_OPTIONS=$env:NODE_OPTIONS"
Write-Host "  PORT=$env:PORT"
Write-Host "  HOST=$env:HOST"
Write-Host "  DISABLE_ESLINT_PLUGIN=$env:DISABLE_ESLINT_PLUGIN"
Write-Host "  CI=$env:CI"
Write-Host ""
Write-Host "Starting npm start..."
Write-Host "Please wait for compilation (this may take 2-3 minutes)..."
Write-Host "Look for 'Compiled successfully!' message."
Write-Host ""
Write-Host "If you see 'Failed to compile', please copy the error message."
Write-Host ""

npm start

