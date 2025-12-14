const { PrismaClient } = require('@prisma/client')
const prisma = global.prisma || (global.prisma = new PrismaClient())
const { logOperation } = require('../middleware/log.middleware')

const normalizeDate = (value) => {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  d.setHours(0, 0, 0, 0)
  return d
}

const parseNumber = (value) => {
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

exports.getDietByDate = async (req, res) => {
  try {
    const { date } = req.query
    const where = {}
    if (date) {
      const start = normalizeDate(date)
      if (!start) {
        return res.status(400).json({ message: 'Invalid date' })
      }
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      where.date = {
        gte: start,
        lt: end
      }
    }
    const records = await prisma.dietRecord.findMany({
      where,
      orderBy: [{ date: 'asc' }, { id: 'asc' }]
    })
    res.json(records)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

const buildPayload = (body) => {
  const date = normalizeDate(body.date)
  const timeSlot = typeof body.timeSlot === 'string' ? body.timeSlot.trim() : ''
  const food = typeof body.food === 'string' ? body.food.trim() : ''
  const quantity = parseNumber(body.quantity)
  const unit = typeof body.unit === 'string' ? body.unit.trim() : ''
  const calories = parseNumber(body.calories)
  const protein = parseNumber(body.protein ?? 0) ?? 0
  const fat = parseNumber(body.fat ?? 0) ?? 0
  const carbs = parseNumber(body.carbs ?? 0) ?? 0
  const note = typeof body.note === 'string' && body.note.trim() !== '' ? body.note.trim() : null
  const photo = typeof body.photo === 'string' && body.photo.trim() !== '' ? body.photo.trim() : null

  if (!date || !timeSlot || !food || !unit) {
    return null
  }
  if (quantity === null || calories === null) {
    return null
  }

  return {
    date,
    timeSlot,
    food,
    quantity,
    unit,
    calories,
    protein,
    fat,
    carbs,
    note,
    photo
  }
}

exports.createDiet = async (req, res) => {
  try {
    const payload = buildPayload(req.body)
    if (!payload) {
      return res.status(400).json({ message: 'Invalid diet data' })
    }
    const record = await prisma.dietRecord.create({ data: payload })
    await logOperation({
      req,
      model: 'DietRecord',
      action: 'create',
      targetId: record.id,
      before: null,
      after: record
    })
    res.json(record)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

exports.updateDiet = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: 'Invalid id' })
    }
    const before = await prisma.dietRecord.findUnique({ where: { id } })
    if (!before) {
      return res.status(404).json({ message: 'Record not found' })
    }
    const payload = buildPayload({ ...before, ...req.body })
    if (!payload) {
      return res.status(400).json({ message: 'Invalid diet data' })
    }
    const record = await prisma.dietRecord.update({
      where: { id },
      data: payload
    })
    await logOperation({
      req,
      model: 'DietRecord',
      action: 'update',
      targetId: record.id,
      before,
      after: record
    })
    res.json(record)
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

exports.deleteDiet = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: 'Invalid id' })
    }
    const before = await prisma.dietRecord.findUnique({ where: { id } })
    if (!before) {
      return res.status(404).json({ message: 'Record not found' })
    }
    await prisma.dietRecord.delete({ where: { id } })
    await logOperation({
      req,
      model: 'DietRecord',
      action: 'delete',
      targetId: id,
      before,
      after: null
    })
    res.json({ message: 'Record deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}
