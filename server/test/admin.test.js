import test from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/app.js'

const server = app.listen(0)
await new Promise(resolve => server.on('listening', resolve))
const { port } = server.address()
const base = `http://127.0.0.1:${port}/api`

let token

test('login as admin', async () => {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'xmo2004', password: 'admin123' })
  })
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.ok(data.token)
  token = data.token
})

test('create/update/delete tag and verify logs', async () => {
  const name = `tag-${Math.random().toString(36).slice(2,8)}`
  // create
  let res = await fetch(`${base}/tags`, { method: 'POST', headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name }) })
  assert.equal(res.status, 200)
  const created = await res.json()
  assert.equal(created.name, name)

  // update
  const newName = `${name}-x`
  res = await fetch(`${base}/tags/${created.id}`, { method: 'PUT', headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: newName }) })
  assert.equal(res.status, 200)
  const updated = await res.json()
  assert.equal(updated.name, newName)

  // delete
  res = await fetch(`${base}/tags/${created.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  assert.equal(res.status, 200)

  // logs
  res = await fetch(`${base}/admin/logs?model=Tag&action=delete`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(res.status, 200)
  const logs = await res.json()
  assert.ok(Array.isArray(logs))
})

test('backup and list backups', async () => {
  let res = await fetch(`${base}/admin/backup`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  assert.equal(res.status, 200)
  res = await fetch(`${base}/admin/backups`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.ok(Array.isArray(data))
})

test('get stats', async () => {
  const res = await fetch(`${base}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(res.status, 200)
  const stats = await res.json()
  assert.ok(stats.posts)
  assert.ok(typeof stats.posts.published === 'number')
  assert.ok(typeof stats.comments === 'number')
})

// optional teardown
test('teardown', () => {
  server.close()
})
