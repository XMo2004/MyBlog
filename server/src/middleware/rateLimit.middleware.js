const rateLimit = require('express-rate-limit')

const minutesToMs = (m) => Math.max(1, parseInt(m || '1', 10)) * 60 * 1000
const parseIntSafe = (v, d) => {
  const n = parseInt(v || String(d), 10)
  return Number.isFinite(n) && n > 0 ? n : d
}

const generalLimiter = rateLimit({
  windowMs: minutesToMs(process.env.RATE_LIMIT_WINDOW_MINUTES || '15'),
  max: parseIntSafe(process.env.RATE_LIMIT_MAX, 300),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimit.ipKeyGenerator
})

const loginLimiter = rateLimit({
  windowMs: minutesToMs(process.env.LOGIN_RATE_LIMIT_WINDOW_MINUTES || '10'),
  max: parseIntSafe(process.env.LOGIN_RATE_LIMIT_MAX, 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try later' },
  keyGenerator: rateLimit.ipKeyGenerator
})

module.exports = { generalLimiter, loginLimiter }
