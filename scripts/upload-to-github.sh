#!/bin/bash

# OpenClaw Install - GitHub 上传脚本
# 作者: 振振公子
# GitHub: https://github.com/henryczq/openclaw-install

set -e

VERSION=""
CREATE_RELEASE=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -r|--release)
            CREATE_RELEASE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo -e "\033[36m========================================\033[0m"
echo -e "\033[36m  OpenClaw Install - GitHub 上传工具\033[0m"
echo -e "\033[36m  作者: 振振公子\033[0m"
echo -e "\033[36m========================================\033[0m"
echo ""

# 检查 git
if ! command -v git &> /dev/null; then
    echo -e "\033[31m错误: 未找到 git\033[0m"
    exit 1
fi

# 检查 gh CLI
if ! command -v gh &> /dev/null; then
    echo -e "\033[31m错误: 未找到 GitHub CLI (gh)\033[0m"
    echo "请先安装: https://cli.github.com/"
    exit 1
fi

# 检查登录状态
if ! gh auth status &> /dev/null; then
    echo -e "\033[33m请先登录 GitHub...\033[0m"
    gh auth login
fi

# 获取版本
if [ -z "$VERSION" ]; then
    VERSION=$(node -p "require('./package.json').version")
fi

echo -e "\033[32m当前版本: v$VERSION\033[0m"
echo ""

# 初始化 git
if [ ! -d ".git" ]; then
    echo -e "\033[33m初始化 Git 仓库...\033[0m"
    git init
    git add .
    git commit -m "Initial commit"
fi

# 检查远程仓库
if ! git remote get-url origin &> /dev/null; then
    echo -e "\033[33m创建 GitHub 仓库...\033[0m"
    
    if gh repo view henryczq/openclaw-install &> /dev/null; then
        echo -e "\033[33m仓库已存在，添加远程地址...\033[0m"
        git remote add origin https://github.com/henryczq/openclaw-install.git
    else
        echo -e "\033[33m创建新的 GitHub 仓库...\033[0m"
        gh repo create openclaw-install --public --source=. --remote=origin
    fi
fi

# 推送代码
echo ""
echo -e "\033[33m推送代码到 GitHub...\033[0m"
git add .
git commit -m "Update version v$VERSION" --allow-empty 2>/dev/null || true
git push -u origin main || git push -u origin master

if [ $? -eq 0 ]; then
    echo ""
    echo -e "\033[32m✅ 代码推送成功!\033[0m"
    echo -e "\033[36m   仓库地址: https://github.com/henryczq/openclaw-install\033[0m"
else
    echo -e "\033[31m代码推送失败\033[0m"
    exit 1
fi

# 创建发布
if [ "$CREATE_RELEASE" = true ]; then
    echo ""
    echo -e "\033[33m构建应用...\033[0m"
    npm run electron:build
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "\033[33m创建 GitHub Release...\033[0m"

        if node ./scripts/create-github-release.mjs "$VERSION"; then
            echo ""
            echo -e "\033[32m✅ 发布成功!\033[0m"
            echo -e "\033[36m   下载地址: https://github.com/henryczq/openclaw-install/releases/tag/v$VERSION\033[0m"
        else
            echo -e "\033[31m创建 GitHub Release 失败\033[0m"
            exit 1
        fi
    fi
fi

echo ""
echo -e "\033[36m========================================\033[0m"
echo -e "\033[32m  操作完成!\033[0m"
echo -e "\033[36m========================================\033[0m"
