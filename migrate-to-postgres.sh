#!/bin/bash
# 数据库迁移脚本：SQLite → PostgreSQL
# 使用方法: ./migrate-to-postgres.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"

echo "======================================"
echo "  博客系统数据库迁移工具"
echo "  SQLite → PostgreSQL"
echo "======================================"
echo ""

# 检查是否在正确的目录
if [ ! -d "$SERVER_DIR" ]; then
    echo "❌ 错误: 找不到 server 目录"
    exit 1
fi

cd "$SERVER_DIR"

# 步骤 1: 导出 SQLite 数据
echo "📦 步骤 1/5: 导出 SQLite 数据..."
npm run db:export

# 步骤 2: 检查 PostgreSQL 连接
echo ""
echo "📋 步骤 2/5: 配置检查"
echo ""
echo "请确保您已完成以下配置:"
echo "  1. PostgreSQL 已安装并运行"
echo "  2. 已创建数据库 (如: CREATE DATABASE blog;)"
echo "  3. 已更新 .env 文件中的 DATABASE_URL"
echo ""
echo "示例 DATABASE_URL:"
echo "  postgresql://postgres:password@localhost:5432/blog?schema=public"
echo ""

read -p "配置已完成? (y/N): " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "请先完成配置后再运行此脚本"
    exit 0
fi

# 步骤 3: 切换 Prisma Schema
echo ""
echo "📝 步骤 3/5: 切换到 PostgreSQL Schema..."

# 备份当前 schema
if [ -f "prisma/schema.prisma" ]; then
    cp prisma/schema.prisma prisma/schema.sqlite.backup.prisma
    echo "  ✅ 已备份当前 schema"
fi

# 使用 PostgreSQL schema
if [ -f "prisma/schema.postgresql.prisma" ]; then
    cp prisma/schema.postgresql.prisma prisma/schema.prisma
    echo "  ✅ 已切换到 PostgreSQL schema"
else
    echo "  ❌ 找不到 PostgreSQL schema 文件"
    exit 1
fi

# 步骤 4: 生成 Prisma 客户端并推送 Schema
echo ""
echo "🔧 步骤 4/5: 初始化 PostgreSQL 数据库..."
npm run db:generate
npm run db:push

# 步骤 5: 导入数据
echo ""
echo "📥 步骤 5/5: 导入数据到 PostgreSQL..."
npm run db:import

echo ""
echo "======================================"
echo "  ✅ 迁移完成!"
echo "======================================"
echo ""
echo "下一步:"
echo "  1. 启动服务器测试: npm start"
echo "  2. 检查网站功能是否正常"
echo "  3. 测试备份功能"
echo ""
echo "如需回滚到 SQLite:"
echo "  cp prisma/schema.sqlite.backup.prisma prisma/schema.prisma"
echo "  编辑 .env，将 DATABASE_URL 改回 file:./dev.db"
echo "  npm run db:generate"
echo ""
