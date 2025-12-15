/**
 * Migration 管理服务 - 企业级数据库迁移方案
 * 自动备份 + 安全迁移 + 回滚支持
 */

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)
const { backupOnce } = require('./backup.service')

/**
 * Migration 前自动备份
 */
const backupBeforeMigration = async () => {
  console.log('🔒 执行 Migration 前自动备份...')

  try {
    const backupFile = await backupOnce()
    console.log(`✅ 备份完成: ${backupFile}`)
    return backupFile
  } catch (error) {
    console.error('❌ 备份失败:', error.message)
    throw new Error('必须先完成备份才能执行 Migration')
  }
}

/**
 * 安全执行 Migration
 * @param {string} name - Migration 名称
 */
const safeMigrate = async (name) => {
  // 1. 先备份
  const backupFile = await backupBeforeMigration()

  // 2. 检查 schema 变更
  console.log('📋 检查 Schema 变更...')
  try {
    const { stdout } = await execAsync('npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script')
    if (stdout.trim()) {
      console.log('检测到以下变更:')
      console.log(stdout)
    }
  } catch (error) {
    // diff 可能会失败，继续执行
  }

  // 3. 创建 Migration
  console.log(`🚀 创建 Migration: ${name}`)
  const migrationName = name || `migration_${Date.now()}`

  try {
    await execAsync(`npx prisma migrate dev --name ${migrationName}`)
    console.log('✅ Migration 创建成功')

    // 4. 记录成功
    await recordMigration(migrationName, backupFile, 'success')

    return {
      success: true,
      migration: migrationName,
      backup: backupFile
    }
  } catch (error) {
    console.error('❌ Migration 失败:', error.message)

    // 5. 记录失败
    await recordMigration(migrationName, backupFile, 'failed', error.message)

    // 6. 提示回滚
    console.log(`💡 可以使用备份文件回滚: ${backupFile}`)

    throw error
  }
}

/**
 * 记录 Migration 历史
 */
const recordMigration = async (name, backupFile, status, error = null) => {
  const historyDir = path.join(__dirname, '..', '..', 'migration-history')
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true })
  }

  const record = {
    name,
    backupFile,
    status,
    error,
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'configured' : 'not-configured'
  }

  const recordFile = path.join(historyDir, `${name}.json`)
  fs.writeFileSync(recordFile, JSON.stringify(record, null, 2))
}

/**
 * 获取 Migration 历史
 */
const getMigrationHistory = async () => {
  const historyDir = path.join(__dirname, '..', '..', 'migration-history')
  if (!fs.existsSync(historyDir)) {
    return []
  }

  const files = fs.readdirSync(historyDir)
  const history = []

  for (const file of files) {
    if (file.endsWith('.json')) {
      const content = fs.readFileSync(path.join(historyDir, file), 'utf-8')
      history.push(JSON.parse(content))
    }
  }

  return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}

/**
 * 应用指定的 Migration（用于生产环境）
 */
const applyMigration = async () => {
  console.log('🚀 应用 Migration (生产环境)...')

  try {
    await execAsync('npx prisma migrate deploy')
    console.log('✅ Migration 应用成功')
    return true
  } catch (error) {
    console.error('❌ Migration 应用失败:', error.message)
    throw error
  }
}

/**
 * 重置数据库 (危险操作，仅开发环境)
 */
const resetDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('生产环境禁止执行 reset 操作!')
  }

  console.log('⚠️  警告: 即将重置数据库...')

  // 先备份
  await backupBeforeMigration()

  try {
    await execAsync('npx prisma migrate reset --force')
    console.log('✅ 数据库重置完成')
    return true
  } catch (error) {
    console.error('❌ 数据库重置失败:', error.message)
    throw error
  }
}

module.exports = {
  backupBeforeMigration,
  safeMigrate,
  getMigrationHistory,
  recordMigration,
  applyMigration,
  resetDatabase
}
