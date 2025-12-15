#!/usr/bin/env node
/**
 * SQLite 数据导出脚本
 * 将 SQLite 数据库中的所有数据导出为 JSON 格式，用于迁移到 PostgreSQL
 */

const fs = require('fs')
const path = require('path')

// 动态导入 better-sqlite3
let Database
try {
  Database = require('better-sqlite3')
} catch (e) {
  console.error('请先安装 better-sqlite3: npm install better-sqlite3')
  process.exit(1)
}

const EXPORT_DIR = path.join(__dirname, '..', 'migration-data')
const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db')

// 确保导出目录存在
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true })
}

// 所有模型表名（按依赖顺序）
const TABLES = [
  'User',
  'Category',
  'Tag',
  'Post',
  'Comment',
  'CommentLike',
  'BookmarkCollection',
  'Bookmark',
  'SiteSettings',
  'Profile',
  'Resource',
  'Project',
  'Column',
  'ColumnNode',
  'OperationLog',
  'VisitLog',
  'WeightRecord',
  'DietRecord',
  // Prisma 多对多关系表
  '_PostToTag'
]

function exportData() {
  console.log('🔄 开始导出 SQLite 数据...\n')

  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ 数据库文件不存在: ${DB_PATH}`)
    process.exit(1)
  }

  const db = new Database(DB_PATH, { readonly: true })
  const exportedData = {}
  const stats = {}

  for (const table of TABLES) {
    try {
      const rows = db.prepare(`SELECT * FROM "${table}"`).all()
      exportedData[table] = rows
      stats[table] = rows.length
      console.log(`  ✅ ${table}: ${rows.length} 条记录`)
    } catch (e) {
      console.log(`  ⚠️  ${table}: 表不存在或为空`)
      exportedData[table] = []
      stats[table] = 0
    }
  }

  db.close()

  // 保存导出数据
  const exportFile = path.join(EXPORT_DIR, `export-${Date.now()}.json`)
  const latestFile = path.join(EXPORT_DIR, 'latest-export.json')

  fs.writeFileSync(exportFile, JSON.stringify(exportedData, null, 2))
  fs.writeFileSync(latestFile, JSON.stringify(exportedData, null, 2))

  // 保存统计信息
  const statsFile = path.join(EXPORT_DIR, 'export-stats.json')
  fs.writeFileSync(statsFile, JSON.stringify({
    exportedAt: new Date().toISOString(),
    tables: stats,
    totalRecords: Object.values(stats).reduce((a, b) => a + b, 0)
  }, null, 2))

  console.log('\n✅ 数据导出完成!')
  console.log(`   导出文件: ${exportFile}`)
  console.log(`   最新导出: ${latestFile}`)
  console.log(`   统计信息: ${statsFile}`)
  console.log(`   总记录数: ${Object.values(stats).reduce((a, b) => a + b, 0)}`)
}

exportData()
