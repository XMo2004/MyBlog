#!/usr/bin/env node

/**
 * 数据库 Migration 管理 CLI
 * 企业级数据库迁移管理工具
 */

const { program } = require('commander')
require('dotenv').config()
const {
  safeMigrate,
  getMigrationHistory,
  applyMigration,
  backupBeforeMigration
} = require('./src/services/migration.service')
const { restoreBackup, listBackups } = require('./src/services/backup.service')

program
  .name('db-migrate')
  .description('企业级数据库迁移管理工具')
  .version('1.0.0')

// 创建新的 Migration（开发环境）
program
  .command('create <name>')
  .description('创建新的 Migration（自动备份 + 安全迁移）')
  .action(async (name) => {
    console.log('🚀 开始执行安全 Migration...\n')
    try {
      const result = await safeMigrate(name)
      console.log('\n✅ Migration 执行成功!')
      console.log(`  Migration: ${result.migration}`)
      console.log(`  备份文件: ${result.backup}`)
      console.log('\n💡 如需回滚，请使用: npm run db:rollback <backup-file>')
    } catch (error) {
      console.error('\n❌ Migration 失败!')
      console.error(`  错误: ${error.message}`)
      console.log('\n💡 数据已备份，可以安全回滚')
      process.exit(1)
    }
  })

// 应用 Migration（生产环境）
program
  .command('deploy')
  .description('应用 Migration 到生产环境')
  .action(async () => {
    console.log('🚀 部署 Migration 到生产环境...\n')
    try {
      // 生产环境也先备份
      await backupBeforeMigration()
      await applyMigration()
      console.log('\n✅ Migration 部署成功!')
    } catch (error) {
      console.error('\n❌ Migration 部署失败!')
      console.error(`  错误: ${error.message}`)
      process.exit(1)
    }
  })

// 查看 Migration 历史
program
  .command('history')
  .description('查看 Migration 历史记录')
  .action(async () => {
    try {
      const history = await getMigrationHistory()

      if (history.length === 0) {
        console.log('📋 暂无 Migration 历史记录')
        return
      }

      console.log('\n📋 Migration 历史记录:\n')
      console.log('='.repeat(80))

      for (const record of history) {
        const status = record.status === 'success' ? '✅' : '❌'
        console.log(`${status} ${record.name}`)
        console.log(`  时间: ${new Date(record.timestamp).toLocaleString('zh-CN')}`)
        console.log(`  备份: ${record.backupFile}`)
        if (record.error) {
          console.log(`  错误: ${record.error}`)
        }
        console.log('-'.repeat(80))
      }
    } catch (error) {
      console.error('❌ 获取历史失败:', error.message)
      process.exit(1)
    }
  })

// 回滚到指定备份
program
  .command('rollback <backup-file>')
  .description('回滚到指定的备份文件')
  .action(async (backupFile) => {
    console.log(`⚠️  准备回滚到: ${backupFile}`)
    console.log('⚠️  警告: 此操作将覆盖当前数据库!')

    // 在实际执行前需要用户确认
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    readline.question('确认继续? (yes/no): ', async (answer) => {
      readline.close()

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ 操作已取消')
        process.exit(0)
      }

      try {
        await restoreBackup(backupFile)
        console.log('\n✅ 回滚成功!')
      } catch (error) {
        console.error('\n❌ 回滚失败!')
        console.error(`  错误: ${error.message}`)
        process.exit(1)
      }
    })
  })

// 列出所有备份
program
  .command('backups')
  .description('列出所有可用的备份文件')
  .action(async () => {
    try {
      const backups = await listBackups()

      if (backups.length === 0) {
        console.log('📋 暂无备份文件')
        return
      }

      console.log('\n📦 可用备份列表:\n')
      console.log('='.repeat(80))

      for (const backup of backups) {
        console.log(`📁 ${backup.file}`)
        console.log(`  类型: ${backup.type}`)
        console.log(`  大小: ${(backup.size / 1024 / 1024).toFixed(2)} MB`)
        console.log(`  时间: ${new Date(backup.createdAt).toLocaleString('zh-CN')}`)
        console.log('-'.repeat(80))
      }

      console.log(`\n💡 使用 'npm run db:rollback <文件名>' 回滚到指定备份`)
    } catch (error) {
      console.error('❌ 获取备份列表失败:', error.message)
      process.exit(1)
    }
  })

program.parse()
