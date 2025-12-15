# 数据库升级说明

## 升级内容

本次升级将数据库技术栈从 **SQLite** 升级到 **PostgreSQL**，提供更强大的生产级数据库支持。

### 主要变更

1. **新增 PostgreSQL 支持**
   - 新的 Prisma Schema: [schema.postgresql.prisma](server/prisma/schema.postgresql.prisma)
   - 添加了优化的数据库索引
   - 支持 pg_dump 进行逻辑备份

2. **增强的备份服务**
   - 自动检测数据库类型 (SQLite/PostgreSQL)
   - PostgreSQL: 使用 pg_dump 创建 SQL 备份
   - 回退方案: Prisma 逻辑备份 (JSON 格式)
   - 支持跨数据库类型的 JSON 备份恢复

3. **数据迁移工具**
   - `npm run db:export` - 导出 SQLite 数据
   - `npm run db:import` - 导入到 PostgreSQL
   - `./migrate-to-postgres.sh` - 一键迁移脚本

4. **Docker 支持**
   - 新增 `docker-compose.yml` 用于容器化部署
   - PostgreSQL + 后端 + 前端一体化部署

## 快速开始

### 方式一：继续使用 SQLite（无需改动）

现有配置继续工作，无需任何修改。

### 方式二：升级到 PostgreSQL

```bash
# 1. 安装 PostgreSQL（如未安装）
# macOS
brew install postgresql@15
brew services start postgresql@15

# 2. 创建数据库
psql -U postgres -c "CREATE DATABASE blog;"

# 3. 运行迁移脚本
./migrate-to-postgres.sh
```

### 方式三：使用 Docker Compose

```bash
# 复制环境配置
cp .env.docker.example .env

# 编辑 .env 设置密码等

# 启动服务
docker compose up -d
```

## 文件变更清单

### 新增文件
- [server/prisma/schema.postgresql.prisma](server/prisma/schema.postgresql.prisma) - PostgreSQL Schema
- [server/scripts/export-sqlite-data.js](server/scripts/export-sqlite-data.js) - SQLite 导出脚本
- [server/scripts/import-to-postgres.js](server/scripts/import-to-postgres.js) - PostgreSQL 导入脚本
- [server/docs/MIGRATION.md](server/docs/MIGRATION.md) - 详细迁移指南
- [server/.env.example](server/.env.example) - 环境配置示例
- [server/Dockerfile](server/Dockerfile) - 后端 Docker 配置
- [client/Dockerfile](client/Dockerfile) - 前端 Docker 配置
- [docker-compose.yml](docker-compose.yml) - Docker Compose 配置
- [.env.docker.example](.env.docker.example) - Docker 环境配置示例
- [migrate-to-postgres.sh](migrate-to-postgres.sh) - 一键迁移脚本

### 修改文件
- [server/package.json](server/package.json) - 添加 pg 依赖和新脚本
- [server/src/services/backup.service.js](server/src/services/backup.service.js) - 支持多数据库类型
- [server/src/controllers/admin.controller.js](server/src/controllers/admin.controller.js) - 更新备份/恢复 API
- [client/src/pages/Admin/Tools.jsx](client/src/pages/Admin/Tools.jsx) - 增强备份界面

## 备份策略对比

| 功能 | SQLite | PostgreSQL |
|------|--------|------------|
| 备份方式 | 文件复制 / VACUUM INTO | pg_dump / Prisma JSON |
| 备份格式 | .db | .sql / .json |
| 增量备份 | 不支持 | 支持 (WAL) |
| 时间点恢复 | 不支持 | 支持 (PITR) |
| 自动调度 | ✅ | ✅ |
| 保留策略 | ✅ | ✅ |

## 环境变量

```env
# SQLite (当前)
DATABASE_URL="file:./dev.db"

# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/blog?schema=public"
```

## 注意事项

1. **数据安全**: 迁移前已自动导出数据到 `server/migration-data/`
2. **回滚方案**: 保留原 SQLite 数据库和 schema，可随时回滚
3. **向后兼容**: 备份服务自动检测数据库类型，无需手动配置
4. **生产建议**: 生产环境推荐使用 PostgreSQL

## 相关文档

- [详细迁移指南](server/docs/MIGRATION.md)
- [Prisma PostgreSQL 文档](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
