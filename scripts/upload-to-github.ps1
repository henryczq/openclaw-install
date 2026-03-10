# OpenClaw Install - GitHub 上传脚本
param(
    [string]$Version = "",
    [switch]$CreateRelease = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenClaw Install - GitHub 上传工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Version -eq "") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $Version = $packageJson.version
}

Write-Host "当前版本：v$Version" -ForegroundColor Green
Write-Host ""

Write-Host "推送代码到 GitHub..." -ForegroundColor Yellow
git add .
git commit -m "Update version v$Version" --allow-empty 2>$null
git push -u origin main

if ($LASTEXITCODE -ne 0) {
    git push -u origin master
}

if ($LASTEXITCODE -eq 0) {
   Write-Host ""
   Write-Host "代码推送成功!" -ForegroundColor Green
   Write-Host "   仓库地址：https://github.com/henryczq/openclaw-install" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  操作完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green