/**
 * PostgreSQL/SQLite 备份服务
 * 支持 PostgreSQL 逻辑备份 (pg_dump) 和 SQLite 文件备份
 * 自动检测数据库类型并使用适当的备份策略
 */

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { promisify } = require('util')
const execAsync = promisify(exec)

const getBackupsDir = () => path.join(__dirname, '..', '..', 'backups')

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/**
 * 解析数据库连接字符串
 * 支持 PostgreSQL: postgresql://user:password@host:port/database
 * 支持 SQLite: file:./dev.db
 */
const parseConnectionString = () => {
  const url = process.env.DATABASE_URL || ''
  
  // SQLite 格式
  if (url.startsWith('file:')) {
    return { type: 'sqlite', path: url.slice(5) }
  }
  
  // PostgreSQL 格式
  try {
    const parsed = new URL(url)
    return {
      type: 'postgresql',
      host: parsed.hostname || 'localhost',
      port: parsed.port || '5432',
      user: parsed.username || 'postgres',
      password: parsed.password || '',
      database: parsed.pathname.slice(1) || 'blog',
      ssl: parsed.searchParams.get('sslmode') || undefined
    }
  } catch (e) {
    console.error('无法解析 DATABASE_URL:', e.message)
    return null
  }
}

/**
 * 获取数据库类型
 */
const getDatabaseType = () => {
  const config = parseConnectionString()
  return config?.type || 'unknown'
}

/**
 * PostgreSQL 备份 - 使用 pg_dump
 */
const backupPostgres = async () => {
  const config = parseConnectionString()
  if (!config || config.type !== 'postgresql') {
    throw new Error('无效的 PostgreSQL 配置')
  }

  const backupsDir = getBackupsDir()
  ensureDir(backupsDir)

  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  const filename = `pg-backup-${timestamp}.sql`
  const filepath = path.join(backupsDir, filename)

  const env = {
    ...process.env,
    PGPASSWORD: config.password,
    PGHOST: config.host,
    PGPORT: config.port,
    PGUSER: config.user,
    PGDATABASE: config.database
  }

  try {
    const { stdout } = await execAsync(
      `pg_dump --clean --if-exists --no-owner --no-privileges --format=plain`,
      { env, maxBuffer: 100 * 1024 * 1024 }
    )
    await fs.promises.writeFile(filepath, stdout)
    console.log(`✅ PostgreSQL 备份完成: ${filename}`)
    return filename
  } catch (error) {
    // 回退到 Prisma 逻辑备份
    console.warn('pg_dump 失败，使用 Prisma 备份:', error.message)
    return await backupWithPrisma(backupsDir, timestamp)
  }
}

/**
 * Prisma 逻辑备份 - 导出所有表数据为 JSON
 */
const backupWithPrisma = async (backupsDir, timestamp) => {
  const { PrismaClient } = require('@prisma/client')
  const prisma = global.prisma || new PrismaClient()

  const tables = [
    'user', 'category', 'tag', 'post', 'comment', 'commentLike',
    'bookmarkCollection', 'bookmark', 'siteSettings', 'profile',
    'resource', 'project', 'column', 'columnNode',
    'operationLog', 'visitLog', 'weightRecord', 'dietRecord'
  ]

  const exportData = {}
  for (const table of tables) {
    try {
      exportData[table] = await prisma[table].findMany()
    } catch (e) {
      exportData[table] = []
    }
  }

  const filename = `prisma-backup-${timestamp}.json`
  const filepath = path.join(backupsDir, filename)
  await fs.promises.writeFile(filepath, JSON.stringify(exportData, null, 2))
  
  console.log(`✅ Prisma 备份完成: ${filename}`)
  return filename
}

/**
 * SQLite 备份 - 使用 VACUUM INTO 或文件复制
 */
const backupSqlite = async () => {
  const { PrismaClient } = require('@prisma/client')
  const prisma = global.prisma || new PrismaClient()

  const backupsDir = getBackupsDir()
  ensureDir(backupsDir)

  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  const config = parseConnectionString()
  
  if (!config || config.type !== 'sqlite') {
    throw new Error('无效的 SQLite 配置')
  }

  const dbPath = path.isAbsolute(config.path) 
    ? config.path 
    : path.join(__dirname, '..', '..', 'prisma', config.path.replace('./', ''))
  
  const basename = path.basename(dbPath).replace('.db', '')
  const filename = `${basename}-${timestamp}.db`
  const target = path.join(backupsDir, filename)

  try {
    await prisma.$executeRawUnsafe(`PRAGMA wal_checkpoint(TRUNCATE)`)
    const escaped = target.replace(/'/g, "''")
    await prisma.$executeRawUnsafe(`VACUUM INTO '${escaped}'`)
    await fs.promises.access(target)
  } catch {
    await fs.promises.copyFile(dbPath, target)
  }

  console.log(`✅ SQLite 备份完成: ${filename}`)
  return filename
}

/**
 * 统一备份接口 - 自动检测数据库类型
 */
const backupOnce = async () => {
  const dbType = getDatabaseType()
  
  switch (dbType) {
    case 'postgresql':
      return await backupPostgres()
    case 'sqlite':
      return await backupSqlite()
    default:
      throw new Error(`不支持的数据库类型: ${dbType}`)
  }
}

/**
 * PostgreSQL 恢复
 */
const restorePostgres = async (filename) => {
  const config = parseConnectionString()
  if (!config || config.type !== 'postgresql') {
    throw new Error('无效的 PostgreSQL 配置')
  }

  const backupsDir = getBackupsDir()
  const filepath = path.join(backupsDir, filename)

  if (!fs.existsSync(filepath)) {
    throw new Error(`备份文件不存在: ${filename}`)
  }

  const env = {
    ...process.env,
    PGPASSWORD: config.password,
    PGHOST: config.host,
    PGPORT: config.port,
    PGUSER: config.user,
    PGDATABASE: config.database
  }

  if (filename.endsWith('.sql')) {
    try {
      await execAsync(`psql < "${filepath}"`, { env, maxBuffer: 100 * 1024 * 1024 })
      console.log(`✅ PostgreSQL 恢复完成: ${filename}`)
      return true
    } catch (error) {
      throw new Error(`恢复失败: ${error.message}`)
    }
  }

  if (filename.endsWith('.json')) {
    return await restoreWithPrisma(filepath)
  }

  throw new Error('不支持的备份文件格式')
}

/**
 * Prisma 恢复 - 从 JSON 导入数据
 */
const restoreWithPrisma = async (filepath) => {
  const { PrismaClient } = require('@prisma/client')
  const prisma = global.prisma || new PrismaClient()

  const data = JSON.parse(await fs.promises.readFile(filepath, 'utf-8'))

  const deleteOrder = [
    'commentLike', 'bookmark', 'bookmarkCollection', 'comment',
    'columnNode', 'column', 'post', 'tag', 'category',
    'resource', 'project', 'siteSettings', 'profile',
    'operationLog', 'visitLog', 'weightRecord', 'dietRecord', 'user'
  ]

  const insertOrder = [
    'user', 'category', 'tag', 'siteSettings', 'profile',
    'resource', 'project', 'column', 'post', 'comment',
    'commentLike', 'bookmarkCollection', 'bookmark', 'columnNode',
    'operationLog', 'visitLog', 'weightRecord', 'dietRecord'
  ]

  await prisma.$transaction(async (tx) => {
    for (const table of deleteOrder) {
      try { await tx[table].deleteMany() } catch (e) {}
    }

    for (const table of insertOrder) {
      const records = data[table] || []
      for (const record of records) {
        try {
          const processed = { ...record }
          for (const key of Object.keys(processed)) {
            if (processed[key] && typeof processed[key] === 'string' &&
                /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(processed[key])) {
              processed[key] = new Date(processed[key])
            }
          }
          await tx[table].create({ data: processed })
        } catch (e) {
          console.warn(`跳过 ${table} 记录:`, e.message)
        }
      }
    }
  })

  console.log(`✅ Prisma 恢复完成`)
  return true
}

/**
 * SQLite 恢复
 */
const restoreSqlite = async (filename) => {
  const { PrismaClient } = require('@prisma/client')
  const prisma = global.prisma || new PrismaClient()

  const config = parseConnectionString()
  if (!config || config.type !== 'sqlite') {
    throw new Error('无效的 SQLite 配置')
  }

  const backupsDir = getBackupsDir()
  const source = path.join(backupsDir, filename)
  const dbPath = path.isAbsolute(config.path) 
    ? config.path 
    : path.join(__dirname, '..', '..', 'prisma', config.path.replace('./', ''))

  if (!fs.existsSync(source)) {
    throw new Error(`备份文件不存在: ${filename}`)
  }

  await prisma.$disconnect()
  await fs.promises.copyFile(source, dbPath)
  await prisma.$connect()

  console.log(`✅ SQLite 恢复完成: ${filename}`)
  return true
}

/**
 * 统一恢复接口
 */
const restoreBackup = async (filename) => {
  const dbType = getDatabaseType()
  
  // JSON 文件可以跨数据库类型恢复
  if (filename.endsWith('.json')) {
    const backupsDir = getBackupsDir()
    return await restoreWithPrisma(path.join(backupsDir, filename))
  }
  
  switch (dbType) {
    case 'postgresql':
      return await restorePostgres(filename)
    case 'sqlite':
      return await restoreSqlite(filename)
    default:
      throw new Error(`不支持的数据库类型: ${dbType}`)
  }
}

/**
 * 列出所有备份
 */
const listBackups = async () => {
  const dir = getBackupsDir()
  ensureDir(dir)

  const files = await fs.promises.readdir(dir)
  const backups = []

  for (const f of files) {
    if (!f.endsWith('.db') && !f.endsWith('.sql') && !f.endsWith('.json')) continue
    const p = path.join(dir, f)
    const stat = await fs.promises.stat(p)
    backups.push({
      file: f,
      size: stat.size,
      createdAt: stat.mtime,
      type: f.endsWith('.sql') ? 'postgresql' : f.endsWith('.json') ? 'prisma' : 'sqlite'
    })
  }

  return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

const retentionDays = () => {
  const v = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10)
  return isNaN(v) ? 7 : Math.max(0, v)
}

const cleanupBackups = async () => {
  const dir = getBackupsDir()
  ensureDir(dir)

  const files = await fs.promises.readdir(dir)
  const now = Date.now()
  const days = retentionDays()
  const keepMs = days * 24 * 60 * 60 * 1000
  
  let deleted = 0
  for (const f of files) {
    if (!f.endsWith('.db') && !f.endsWith('.sql') && !f.endsWith('.json')) continue
    const p = path.join(dir, f)
    const stat = await fs.promises.stat(p)
    if (now - stat.mtimeMs > keepMs) {
      await fs.promises.unlink(p)
      deleted++
    }
  }

  if (deleted > 0) {
    console.log(`🗑️ 清理了 ${deleted} 个过期备份`)
  }
}

const parseSchedule = () => {
  const s = process.env.BACKUP_SCHEDULE || '04:00'
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(s)
  const h = m ? parseInt(m[1], 10) : 4
  const min = m ? parseInt(m[2], 10) : 0
  return { h, min }
}

const msUntilNext = (h, min) => {
  const now = new Date()
  const next = new Date(now)
  next.setHours(h, min, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next - now
}

const runCycle = async () => {
  try {
    await backupOnce()
    await cleanupBackups()
  } catch (e) {
    console.error('备份失败:', e.message)
  }
}

const scheduleDaily = () => {
  const { h, min } = parseSchedule()
  const firstDelay = msUntilNext(h, min)
  
  console.log(`📅 备份已调度: 每天 ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
  console.log(`   数据库类型: ${getDatabaseType()}`)
  
  setTimeout(() => {
    runCycle()
    setInterval(runCycle, 24 * 60 * 60 * 1000)
  }, firstDelay)
}

module.exports = {
  backupOnce,
  restoreBackup,
  cleanupBackups,
  listBackups,
  scheduleDaily,
  getDatabaseType,
  parseConnectionString
}
