# 数据库管理快速开始

## 🚀 立即开始使用

### 1. 安装依赖（仅首次）

```bash
cd server
npm install
```

### 2. 修改表结构的正确流程

#### ❌ 错误做法（会丢失数据）
```bash
# 千万不要这样做！
npm run db:push
```

#### ✅ 正确做法（保护数据）
```bash
# 1. 修改 prisma/schema.prisma

# 2. 创建安全的 migration
npm run db:migrate:dev add_new_field

# 系统会自动：
# - 备份当前数据库
# - 创建 migration
# - 应用到数据库
# - 记录历史
```

### 3. 常用命令速查

```bash
# 开发环境：创建 migration
npm run db:migrate:dev <name>

# 生产环境：部署 migration  
npm run db:migrate:prod

# 查看 migration 历史
npm run db:migrate:history

# 查看所有备份
npm run db:backups

# 回滚到备份
npm run db:rollback <backup-file>

# 打开数据库管理界面
npm run db:studio
```

## 📝 实际例子

### 例子 1：添加用户头像字段

```bash
# 1. 修改 schema.prisma
# model User {
#   ...
#   avatar String?  // 新增
# }

# 2. 创建 migration
npm run db:migrate:dev add_user_avatar

# 输出：
# 🔒 执行 Migration 前自动备份...
# ✅ 备份完成: prisma-backup-20251215120000.json
# 🚀 创建 Migration: add_user_avatar
# ✅ Migration 创建成功!
#   Migration: add_user_avatar
#   备份文件: prisma-backup-20251215120000.json
```

### 例子 2：Migration 出错后回滚

```bash
# 1. 查看可用备份
npm run db:backups

# 2. 回滚到最近的备份
npm run db:rollback prisma-backup-20251215120000.json

# 3. 修复 schema 后重试
npm run db:migrate:dev fixed_version
```

## 🎯 重点提示

### ✅ 一定要做的

1. **每次修改表结构使用 migrate**
   ```bash
   npm run db:migrate:dev <描述性名称>
   ```

2. **生产环境部署前测试**
   ```bash
   # 开发环境测试
   npm run db:migrate:dev test_change
   
   # 确认无误后，生产环境部署
   npm run db:migrate:prod
   ```

3. **定期查看备份**
   ```bash
   npm run db:backups
   ```

### ❌ 绝对不要做的

1. **不要使用 `db:push` 修改生产数据库**
   - ⚠️ 会导致数据丢失
   - 仅在原型开发时使用

2. **不要直接修改数据库**
   - 所有修改都通过 migration
   - 保持代码和数据库同步

3. **不要删除已部署的 migration 文件**
   - migration 文件要提交到 git
   - 历史记录很重要

## 🔧 故障处理

### 问题：Migration 失败了怎么办？

```bash
# 1. 不要慌，数据已经自动备份了

# 2. 查看备份列表
npm run db:backups

# 3. 回滚到最近的备份
npm run db:rollback <最近的备份文件>

# 4. 修复 schema.prisma 后重试
npm run db:migrate:dev fixed_version
```

### 问题：不小心用了 db:push 丢失了数据？

```bash
# 1. 立即停止操作

# 2. 查看是否有自动备份
npm run db:backups

# 3. 恢复到最近的备份
npm run db:rollback <备份文件>
```

### 问题：如何查看 migration 历史？

```bash
npm run db:migrate:history

# 输出：
# 📋 Migration 历史记录:
# ✅ add_user_avatar
#   时间: 2025/12/15 12:00:00
#   备份: prisma-backup-20251215120000.json
```

## 📚 更多信息

详细文档请查看：
- [完整使用指南](./DATABASE_MIGRATION_GUIDE.md)
- [Prisma Migration 官方文档](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## ⚡ 紧急救援

如果遇到严重问题：

1. **立即停止所有操作**
2. **查看备份：** `npm run db:backups`
3. **联系数据库管理员**
4. **准备回滚方案**

---

**记住：数据无价，谨慎操作！**

使用 `npm run db:migrate:dev` 而不是 `db:push`，你的数据会安全无忧！
