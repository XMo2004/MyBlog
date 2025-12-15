const { PrismaClient } = require('@prisma/client')
const prisma = global.prisma || (global.prisma = new PrismaClient())

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
    // 删除24小时之前的操作日志
    const expire = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await prisma.operationLog.deleteMany({ where: { createdAt: { lt: expire } } })
  } catch (e) {}
}

module.exports = { logOperation }
