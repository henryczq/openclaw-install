# OpenClaw Install - GitHub 上传脚本
param(
    [string]$Version = "",
    [switch]$CreateRelease = $false
)

$ErrorActionPreference = 'Stop'

$RemoteName = 'origin'
$RemoteUrl = 'https://github.com/henryczq/openclaw-install.git'
$ProjectDir = Split-Path -Parent $PSScriptRoot

function Write-Section($text, $color = 'Cyan') {
    Write-Host $text -ForegroundColor $color
}

function Normalize-GitPath($path) {
    return ($path -replace '\\', '/').Trim()
}

function Test-IsPathInProject($path, $projectPath) {
    $normalizedPath = Normalize-GitPath $path
    $normalizedProjectPath = Normalize-GitPath $projectPath

    if ($normalizedProjectPath -eq '.' -or [string]::IsNullOrWhiteSpace($normalizedProjectPath)) {
        return $true
    }

    return $normalizedPath -eq $normalizedProjectPath -or $normalizedPath.StartsWith("$normalizedProjectPath/")
}

Write-Section "========================================"
Write-Section "  OpenClaw Install - GitHub 上传工具"
Write-Section "========================================"
Write-Host ""

Push-Location $ProjectDir

try {
    $RepoRoot = (git rev-parse --show-toplevel).Trim()
    if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
        throw '当前目录不在 Git 仓库中，无法上传。'
    }

    $ProjectPath = (git -C $ProjectDir rev-parse --show-prefix).Trim()
    $ProjectPath = $ProjectPath.TrimEnd('/')
    if ([string]::IsNullOrWhiteSpace($ProjectPath)) {
        $ProjectPath = '.'
    }

    if ($Version -eq '') {
        $PackageJsonPath = Join-Path $ProjectDir 'package.json'
        $PackageJson = Get-Content -Raw -Encoding UTF8 $PackageJsonPath | ConvertFrom-Json
        $Version = $PackageJson.version
    }

    if ([string]::IsNullOrWhiteSpace($Version)) {
        throw '未能从 package.json 读取版本号。'
    }

    $CurrentBranch = (git -C $RepoRoot branch --show-current).Trim()
    if ([string]::IsNullOrWhiteSpace($CurrentBranch)) {
        throw '无法识别当前分支。'
    }

    Write-Host "当前版本：v$Version" -ForegroundColor Green
    Write-Host "项目目录：$ProjectDir" -ForegroundColor DarkCyan
    Write-Host "仓库根目录：$RepoRoot" -ForegroundColor DarkCyan
    Write-Host "推送范围：$ProjectPath" -ForegroundColor DarkCyan
    Write-Host "当前分支：$CurrentBranch" -ForegroundColor DarkCyan
    Write-Host ""

    $ExistingRemote = ''
    try {
        $ExistingRemote = (git -C $RepoRoot remote get-url $RemoteName 2>$null).Trim()
    } catch {
        $ExistingRemote = ''
    }

    if ([string]::IsNullOrWhiteSpace($ExistingRemote)) {
        Write-Host "未找到 origin，正在添加远程仓库..." -ForegroundColor Yellow
        git -C $RepoRoot remote add $RemoteName $RemoteUrl
    } elseif ($ExistingRemote -ne $RemoteUrl) {
        Write-Host "origin 地址与目标不一致，正在更新..." -ForegroundColor Yellow
        Write-Host "当前：$ExistingRemote" -ForegroundColor Yellow
        Write-Host "目标：$RemoteUrl" -ForegroundColor Yellow
        git -C $RepoRoot remote set-url $RemoteName $RemoteUrl
    }

    $StagedFiles = @(git -C $RepoRoot diff --cached --name-only)
    $StagedOutsideProject = @($StagedFiles | Where-Object { $_ -and -not (Test-IsPathInProject $_ $ProjectPath) })
    if ($StagedOutsideProject.Count -gt 0) {
        Write-Host '检测到项目目录之外已有暂存内容，本次上传已停止：' -ForegroundColor Red
        $StagedOutsideProject | ForEach-Object {
            Write-Host "  - $_" -ForegroundColor Red
        }
        throw '请先处理项目目录之外的暂存内容，再执行上传脚本。'
    }

    Write-Host '暂存项目目录下的改动...' -ForegroundColor Yellow
    git -C $RepoRoot add --all -- $ProjectPath

    $ProjectStagedFiles = @(git -C $RepoRoot diff --cached --name-only -- $ProjectPath)
    if ($ProjectStagedFiles.Count -gt 0) {
        $CommitMessage = "Update openclaw-install to v$Version"
        Write-Host "创建提交：$CommitMessage" -ForegroundColor Yellow
        git -C $RepoRoot commit -m $CommitMessage
    } else {
        Write-Host '项目目录下没有新的可提交改动，跳过提交。' -ForegroundColor Yellow
    }

    Write-Host "推送代码到 GitHub（$CurrentBranch）..." -ForegroundColor Yellow
    git -C $RepoRoot push -u $RemoteName $CurrentBranch

    Write-Host ''
    Write-Host '代码推送成功!' -ForegroundColor Green
    Write-Host "   仓库地址：$RemoteUrl" -ForegroundColor Cyan

    if ($CreateRelease) {
        Write-Host ''
        Write-Host '已收到 CreateRelease 参数，但当前脚本未自动创建 Release。' -ForegroundColor Yellow
    }

    Write-Host ''
    Write-Section '========================================' 'Green'
    Write-Section '  操作完成!' 'Green'
    Write-Section '========================================' 'Green'
}
catch {
    Write-Host ''
    Write-Host "上传失败：$($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
