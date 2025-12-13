import test from 'node:test'
import assert from 'node:assert/strict'
import * as backupService from '../src/services/backup.service.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const { backupOnce, cleanupBackups } = backupService
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backupsDir = path.join(__dirname, '..', 'backups')

test('backupOnce creates a backup file', async () => {
  const file = await backupOnce()
  const p = path.join(backupsDir, file)
  assert.ok(fs.existsSync(p))
})

test('cleanupBackups removes old files by mtime', async () => {
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true })
  const tmp = path.join(backupsDir, 'dev-test-old.db')
  await fs.promises.writeFile(tmp, 'x')
  const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  await fs.promises.utimes(tmp, past, past)
  process.env.BACKUP_RETENTION_DAYS = '1'
  await cleanupBackups()
  assert.equal(fs.existsSync(tmp), false)
})
