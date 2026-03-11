# Test GitHub proxy script
param([string]$TestRepo = "https://github.com/openclaw/openclaw.git")

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  GitHub Proxy Test Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test configurations
$configs = @(
    @{ Name = "Direct"; Url = $TestRepo },
    @{ Name = "githubfast.com"; Url = $TestRepo -replace "github.com", "githubfast.com" },
    @{ Name = "gitclone.com"; Url = $TestRepo -replace "github.com", "gitclone.com/github.com" }
)

$results = @()

foreach ($cfg in $configs) {
    Write-Host "Testing: $($cfg.Name)" -ForegroundColor Yellow
    Write-Host "URL: $($cfg.Url)" -ForegroundColor Gray
    
    $success = $false
    $time = 0
    $err = ""
    
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $pinfo = New-Object System.Diagnostics.ProcessStartInfo
        $pinfo.FileName = "git"
        $pinfo.Arguments = "ls-remote --heads --quiet `"$($cfg.Url)`""
        $pinfo.RedirectStandardOutput = $true
        $pinfo.RedirectStandardError = $true
        $pinfo.UseShellExecute = $false
        $pinfo.CreateNoWindow = $true
        
        $proc = New-Object System.Diagnostics.Process
        $proc.StartInfo = $pinfo
        $proc.Start() | Out-Null
        
        $done = $proc.WaitForExit(30000)
        if (-not $done) {
            $proc.Kill()
            throw "Timeout"
        }
        
        $sw.Stop()
        $time = $sw.ElapsedMilliseconds
        
        if ($proc.ExitCode -eq 0) {
            $success = $true
            Write-Host "  SUCCESS - ${time}ms" -ForegroundColor Green
        } else {
            $err = $proc.StandardError.ReadToEnd()
            throw $err
        }
    } catch {
        $err = $_.Exception.Message
        Write-Host "  FAILED - $err" -ForegroundColor Red
    }
    
    $results += @{ Name = $cfg.Name; Url = $cfg.Url; Success = $success; Time = $time; Error = $err }
    Write-Host ""
}

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$working = $results | Where-Object { $_.Success }

if ($working.Count -eq 0) {
    Write-Host "No working proxies found!" -ForegroundColor Red
} else {
    Write-Host "Working proxies:" -ForegroundColor Green
    foreach ($p in $working) {
        Write-Host "  - $($p.Name): $($p.Time)ms" -ForegroundColor Green
    }
    
    $best = $working | Sort-Object Time | Select-Object -First 1
    Write-Host ""
    Write-Host "Best: $($best.Name)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
