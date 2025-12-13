import test from 'node:test'
import assert from 'node:assert/strict'
import app from '../src/app.js'

const server = app.listen(0)
await new Promise((resolve) => server.on('listening', resolve))
const { port } = server.address()
const base = `http://127.0.0.1:${port}/api`

let token
let createdId
const today = new Date().toISOString().split('T')[0]

test('login as admin for diet', async () => {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  })
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.ok(data.token)
  token = data.token
})

test('reject invalid diet payload', async () => {
  const res = await fetch(`${base}/diet`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      date: '',
      timeSlot: '',
      food: '',
      quantity: -1,
      unit: '',
      calories: -10
    })
  })
  assert.equal(res.status, 400)
})

test('create diet record', async () => {
  const res = await fetch(`${base}/diet`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      date: today,
      timeSlot: 'breakfast',
      food: '测试食物',
      quantity: 1,
      unit: '份',
      calories: 300,
      protein: 20,
      fat: 5,
      carbs: 40,
      note: '单元测试创建'
    })
  })
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.ok(data.id)
  createdId = data.id
})

test('query diet records by date', async () => {
  const res = await fetch(`${base}/diet?date=${today}`)
  assert.equal(res.status, 200)
  const list = await res.json()
  assert.ok(Array.isArray(list))
  const found = list.find((item) => item.id === createdId)
  assert.ok(found)
  assert.equal(found.food, '测试食物')
})

test('update diet record', async () => {
  const res = await fetch(`${base}/diet/${createdId}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      calories: 350,
      note: '单元测试更新'
    })
  })
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.equal(Math.round(data.calories), 350)
  assert.equal(data.note, '单元测试更新')
})

test('delete diet record', async () => {
  const res = await fetch(`${base}/diet/${createdId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  assert.equal(res.status, 200)
})

test('teardown diet server', () => {
  server.close()
})

