#!/usr/bin/env node
/**
 * 数据迁移脚本：从 SQLite 导入到 PostgreSQL
 * 
 * 使用方法：
 * 1. 确保已导出 SQLite 数据: npm run db:export
 * 2. 更新 .env 中的 DATABASE_URL 为 PostgreSQL 连接字符串
 * 3. 运行迁移: npm run db:import
 */

const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const MIGRATION_DIR = path.join(__dirname, '..', 'migration-data')
const EXPORT_FILE = path.join(MIGRATION_DIR, 'latest-export.json')

// 表依赖顺序（用于正确的插入顺序）
const INSERT_ORDER = [
  'User',
  'Category',
  'Tag',
  'SiteSettings',
  'Profile',
  'Resource',
  'Project',
  'Column',
  'Post',
  'Comment',
  'CommentLike',
  'BookmarkCollection',
  'Bookmark',
  'ColumnNode',
  'OperationLog',
  'VisitLog',
  'WeightRecord',
  'DietRecord',
  '_PostToTag'  // 多对多关系表
]

// 删除顺序（依赖关系反序）
const DELETE_ORDER = [
  '_PostToTag',
  'DietRecord',
  'WeightRecord',
  'VisitLog',
  'OperationLog',
  'ColumnNode',
  'Bookmark',
  'BookmarkCollection',
  'CommentLike',
  'Comment',
  'Post',
  'Column',
  'Project',
  'Resource',
  'Profile',
  'SiteSettings',
  'Tag',
  'Category',
  'User'
]

// 表名到 Prisma 模型名的映射
const TABLE_TO_MODEL = {
  'User': 'user',
  'Category': 'category',
  'Tag': 'tag',
  'Post': 'post',
  'Comment': 'comment',
  'CommentLike': 'commentLike',
  'BookmarkCollection': 'bookmarkCollection',
  'Bookmark': 'bookmark',
  'SiteSettings': 'siteSettings',
  'Profile': 'profile',
  'Resource': 'resource',
  'Project': 'project',
  'Column': 'column',
  'ColumnNode': 'columnNode',
  'OperationLog': 'operationLog',
  'VisitLog': 'visitLog',
  'WeightRecord': 'weightRecord',
  'DietRecord': 'dietRecord'
}

/**
 * 日期字段名称列表
 */
const DATE_FIELDS = ['createdAt', 'updatedAt', 'date', 'lastLogin', 'membershipExpiry']

/**
 * 处理日期字段
 */
function processRecord(record) {
  const processed = { ...record }
  
  for (const key of Object.keys(processed)) {
    const value = processed[key]
    
    // 转换日期字符串（ISO 格式）
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
      processed[key] = new Date(value)
    }
    
    // 转换整数时间戳（毫秒）- SQLite 可能存储为整数
    if (typeof value === 'number' && DATE_FIELDS.includes(key)) {
      // 检查是否是毫秒时间戳（大于 2000年的时间戳）
      if (value > 946684800000) { // 2000-01-01 的毫秒时间戳
        processed[key] = new Date(value)
      }
    }
    
    // SQLite 的 boolean 可能是 0/1
    if ((key === 'published' || key === 'featured' || key === 'isDefault') && typeof value === 'number') {
      processed[key] = value === 1
    }
  }
  
  return processed
}

/**
 * 获取表的最大 ID
 */
async function getMaxId(prisma, modelName) {
  try {
    const result = await prisma[modelName].findFirst({
      orderBy: { id: 'desc' },
      select: { id: true }
    })
    return result?.id || 0
  } catch {
    return 0
  }
}

/**
 * 重置 PostgreSQL 序列
 */
async function resetSequence(prisma, tableName, maxId) {
  try {
    // PostgreSQL 序列重置
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), ${maxId + 1}, false)`
    )
    console.log(`  📊 重置 ${tableName} 序列到 ${maxId + 1}`)
  } catch (e) {
    // 忽略序列不存在的错误
  }
}

async function importData() {
  console.log('🔄 开始导入数据到 PostgreSQL...\n')

  // 检查导出文件
  if (!fs.existsSync(EXPORT_FILE)) {
    console.error(`❌ 导出文件不存在: ${EXPORT_FILE}`)
    console.error('   请先运行: npm run db:export')
    process.exit(1)
  }

  // 读取导出数据
  const exportData = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf-8'))
  
  // 创建 Prisma 客户端
  const prisma = new PrismaClient()

  try {
    // 验证连接
    await prisma.$connect()
    console.log('✅ 已连接到 PostgreSQL\n')

    // 统计
    const stats = { imported: {}, skipped: {}, errors: {} }

    // 清空现有数据（可选）
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const answer = await new Promise(resolve => {
      rl.question('⚠️  是否清空目标数据库中的现有数据? (y/N): ', resolve)
    })
    rl.close()

    if (answer.toLowerCase() === 'y') {
      console.log('\n🗑️  清空现有数据...')
      for (const table of DELETE_ORDER) {
        const modelName = TABLE_TO_MODEL[table]
        if (modelName) {
          try {
            const deleted = await prisma[modelName].deleteMany()
            console.log(`  ✅ ${table}: 删除 ${deleted.count} 条`)
          } catch (e) {
            console.log(`  ⚠️  ${table}: 跳过`)
          }
        }
      }
      console.log('')
    }

    // 导入数据
    console.log('📥 导入数据...\n')

    for (const table of INSERT_ORDER) {
      const modelName = TABLE_TO_MODEL[table]
      const records = exportData[table] || []
      
      if (records.length === 0) {
        console.log(`  ⏭️  ${table}: 无数据`)
        continue
      }

      // 特殊处理多对多关系表
      if (table === '_PostToTag') {
        let imported = 0
        for (const record of records) {
          try {
            await prisma.post.update({
              where: { id: record.A },
              data: {
                tags: {
                  connect: { id: record.B }
                }
              }
            })
            imported++
          } catch (e) {
            // 可能已经存在关联
          }
        }
        console.log(`  ✅ ${table}: 导入 ${imported}/${records.length} 条关联`)
        continue
      }

      if (!modelName) {
        console.log(`  ⚠️  ${table}: 未找到模型映射`)
        continue
      }

      let imported = 0
      let skipped = 0
      let errors = 0

      for (const record of records) {
        try {
          const processed = processRecord(record)
          await prisma[modelName].create({ data: processed })
          imported++
        } catch (e) {
          if (e.code === 'P2002') {
            // 唯一约束冲突，尝试更新
            try {
              const processed = processRecord(record)
              await prisma[modelName].upsert({
                where: { id: record.id },
                create: processed,
                update: processed
              })
              imported++
            } catch {
              skipped++
            }
          } else {
            errors++
            if (errors <= 3) {
              console.warn(`    ❌ ${table} ID ${record.id}: ${e.message}`)
            }
          }
        }
      }

      stats.imported[table] = imported
      stats.skipped[table] = skipped
      stats.errors[table] = errors

      const status = errors > 0 ? '⚠️' : '✅'
      console.log(`  ${status} ${table}: 导入 ${imported}, 跳过 ${skipped}, 错误 ${errors}`)
    }

    // 重置序列
    console.log('\n📊 重置 PostgreSQL 序列...')
    for (const table of Object.keys(TABLE_TO_MODEL)) {
      const modelName = TABLE_TO_MODEL[table]
      const maxId = await getMaxId(prisma, modelName)
      if (maxId > 0) {
        await resetSequence(prisma, table, maxId)
      }
    }

    // 总结
    const totalImported = Object.values(stats.imported).reduce((a, b) => a + b, 0)
    const totalErrors = Object.values(stats.errors).reduce((a, b) => a + b, 0)

    console.log('\n✅ 数据迁移完成!')
    console.log(`   总导入: ${totalImported} 条记录`)
    if (totalErrors > 0) {
      console.log(`   ⚠️  总错误: ${totalErrors} 条`)
    }

  } catch (e) {
    console.error('❌ 迁移失败:', e)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importData()
