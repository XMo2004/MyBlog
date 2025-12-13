const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }) }

const getPrismaDir = () => path.join(__dirname, '..', '..', 'prisma')
const getBackupsDir = () => path.join(__dirname, '..', '..', 'backups')

const resolveDbPath = () => {
  const url = process.env.DATABASE_URL || 'file:./dev.db'
  if (url.startsWith('file:')) {
    const p = url.slice(5)
    if (p.startsWith('./') || p.startsWith('../')) return path.join(getPrismaDir(), p)
    return p ? p : path.join(getPrismaDir(), 'dev.db')
  }
  return path.join(getPrismaDir(), 'dev.db')
}

const checkpointWal = async () => {
  try {
    await prisma.$executeRawUnsafe(`PRAGMA wal_checkpoint(TRUNCATE)`)
  } catch (e) {}
}

const backupOnce = async () => {
  const dbPath = resolveDbPath()
  const backupsDir = getBackupsDir()
  ensureDir(backupsDir)
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)
  const basename = path.basename(dbPath).replace('.db', '')
  const filename = `${basename}-${stamp}.db`
  const target = path.join(backupsDir, filename)
  await checkpointWal()
  try {
    const escaped = target.replace(/'/g, "''")
    await prisma.$executeRawUnsafe(`VACUUM INTO '${escaped}'`)
    await fs.promises.access(target)
  } catch {
    await fs.promises.copyFile(dbPath, target)
  }
  return filename
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
  for (const f of files) {
    if (!f.endsWith('.db')) continue
    const p = path.join(dir, f)
    const stat = await fs.promises.stat(p)
    if (now - stat.mtimeMs > keepMs) await fs.promises.unlink(p)
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
  } catch (e) {}
}

const scheduleDaily = () => {
  const { h, min } = parseSchedule()
  const firstDelay = msUntilNext(h, min)
  setTimeout(() => {
    runCycle()
    setInterval(runCycle, 24 * 60 * 60 * 1000)
  }, firstDelay)
}

module.exports = { backupOnce, cleanupBackups, scheduleDaily }
