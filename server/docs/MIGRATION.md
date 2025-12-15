# 数据库迁移指南：SQLite → PostgreSQL

本指南将帮助你安全地将博客系统从 SQLite 迁移到 PostgreSQL。

## 为什么选择 PostgreSQL？

| 特性 | SQLite | PostgreSQL |
|------|--------|------------|
| 并发处理 | 有限 | 优秀 |
| 数据完整性 | 基础 | 企业级 |
| 备份恢复 | 文件复制 | 增量备份、时间点恢复 |
| 扩展性 | 单机 | 支持主从复制、集群 |
| 全文搜索 | 有限 | 内置强大支持 |
| JSON 支持 | 基础 | 原生 JSONB |
| 生产部署 | 不推荐 | 推荐 |

## 迁移步骤

### 1. 备份当前 SQLite 数据

```bash
cd server

# 方法1: 使用导出脚本 (推荐)
npm run db:export

# 方法2: 直接复制数据库文件
cp prisma/dev.db prisma/dev.db.backup
```

导出的数据将保存在 `server/migration-data/` 目录中。

### 2. 安装 PostgreSQL

#### macOS (使用 Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### 使用 Docker (推荐)
```bash
docker compose up -d postgres
```

### 3. 创建数据库

```bash
# 连接到 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE blog;

# 创建用户 (可选)
CREATE USER bloguser WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE blog TO bloguser;

# 退出
\q
```

### 4. 更新环境配置

编辑 `server/.env`:

```env
# 旧配置 (注释掉)
# DATABASE_URL="file:./dev.db"

# 新配置
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/blog?schema=public"
```

### 5. 切换 Prisma Schema

```bash
# 备份当前 schema
cp prisma/schema.prisma prisma/schema.sqlite.prisma

# 使用 PostgreSQL schema
cp prisma/schema.postgresql.prisma prisma/schema.prisma
```

### 6. 生成 Prisma 客户端并推送 Schema

```bash
# 生成客户端
npm run db:generate

# 推送 schema 到数据库 (首次)
npm run db:push

# 或者使用迁移 (生产环境推荐)
npm run db:migrate
```

### 7. 导入数据

```bash
npm run db:import
```

按提示操作，脚本会：
1. 连接到 PostgreSQL
2. (可选) 清空现有数据
3. 按正确顺序导入所有表
4. 重置自增序列

### 8. 验证迁移

```bash
# 启动服务器
npm start

# 或使用开发模式
npm run dev
```

检查：
- [ ] 网站能正常访问
- [ ] 登录功能正常
- [ ] 文章列表正确显示
- [ ] 后台管理可用
- [ ] 备份功能正常

## 回滚方案

如果迁移失败，可以轻松回滚：

```bash
# 恢复 SQLite schema
cp prisma/schema.sqlite.prisma prisma/schema.prisma

# 恢复环境变量
# 编辑 .env，将 DATABASE_URL 改回 file:./dev.db

# 重新生成客户端
npm run db:generate

# 重启服务
npm start
```

## Docker Compose 部署

使用 Docker Compose 一键部署 PostgreSQL 和应用：

```bash
# 构建并启动
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

详见 `docker-compose.yml` 配置。

## 生产环境备份策略

PostgreSQL 版本支持多种备份方式：

### 1. 逻辑备份 (pg_dump)
```bash
# 手动备份
npm run db:backup

# 查看备份列表
# 通过管理后台或 API: GET /api/admin/backups
```

### 2. 自动每日备份
服务器启动时会自动调度每日备份，时间由 `BACKUP_SCHEDULE` 环境变量控制。

### 3. 时间点恢复 (PITR)
生产环境建议配置 WAL 归档实现时间点恢复，这需要额外的 PostgreSQL 配置。

## 常见问题

### Q: 迁移后序列不正确？
A: 运行导入脚本会自动重置序列。如需手动重置：
```sql
SELECT setval(pg_get_serial_sequence('"User"', 'id'), (SELECT MAX(id) FROM "User") + 1, false);
```

### Q: 如何查看 PostgreSQL 连接状态？
A: 
```bash
# 使用 psql
psql -U postgres -d blog -c "SELECT version();"

# 或通过 Prisma Studio
npm run db:studio
```

### Q: 备份文件在哪里？
A: 备份文件存储在 `server/backups/` 目录，支持 `.sql`（PostgreSQL）、`.json`（Prisma）、`.db`（SQLite）格式。

### Q: 如何迁移到云数据库？
A: 
1. 使用云服务商提供的 PostgreSQL（如 Supabase、Neon、Railway、AWS RDS）
2. 获取连接字符串
3. 更新 `DATABASE_URL`
4. 运行 `npm run db:push` 和 `npm run db:import`

## 数据库架构对比

新的 PostgreSQL schema 包含以下优化：
- 添加了适当的索引以提升查询性能
- 支持更好的全文搜索
- 原生 JSONB 类型支持（未来可用于 skills、interests 等字段）
- 更强的数据完整性约束
