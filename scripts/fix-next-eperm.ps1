# Fix EPERM on .next\trace (Windows).
# Run from project root: npm run dev:fresh
# Or: powershell -ExecutionPolicy Bypass -File ./scripts/fix-next-eperm.ps1

$ErrorActionPreference = "Stop"
$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path) }
Set-Location $root

Write-Host "[fix-next-eperm] Stopping Node processes (next dev may lock .next)..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "[fix-next-eperm] Removing .next..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
}
Write-Host "[fix-next-eperm] Starting dev server..." -ForegroundColor Green
npm run dev
