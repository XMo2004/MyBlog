const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const logOperation = async ({ req, model, action, targetId, before, after }) => {
  try {
    const payload = {
      model,
      action,
      targetId: typeof targetId === 'number' ? targetId : null,
      userId: req && req.user ? req.user.userId : null,
      before: before ? JSON.stringify(before) : null,
      after: after ? JSON.stringify(after) : null,
      ip: req && req.ip ? req.ip : null,
    }
    await prisma.operationLog.create({ data: payload })
  } catch (e) {}
}

module.exports = { logOperation }
