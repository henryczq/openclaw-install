@echo off
chcp 65001 >nul
echo ==========================================
echo   GitHub Proxy Test Tool
echo ==========================================
echo.

powershell.exe -ExecutionPolicy Bypass -File "%~dp0test-github-proxy.ps1"

echo.
echo Press any key to exit...
pause >nul
