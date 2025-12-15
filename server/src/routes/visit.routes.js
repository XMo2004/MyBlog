const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visit.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// 公开接口 - 记录访问
router.post('/', visitController.recordVisit);

// 管理员接口 - 获取统计数据
router.get('/analytics', verifyToken, isAdmin, visitController.getAnalytics);
router.get('/recent', verifyToken, isAdmin, visitController.getRecentVisits);

module.exports = router;
