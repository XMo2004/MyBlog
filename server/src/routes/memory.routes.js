const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/auth.middleware');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
});

const {
  getMemories,
  getAllMemories,
  getMemory,
  createMemory,
  updateMemory,
  deleteMemory,
  bulkDeleteMemories,
  updateMemoryOrder,
  getMemoryImage,
  getMemoryThumbnail,
} = require('../controllers/memory.controller');

// 公开路由 - 获取已发布的回忆
router.get('/', getMemories);

// 管理路由 - 需要管理员权限 (放在 /:id 之前避免路由冲突)
router.get('/admin/all', verifyToken, isAdmin, getAllMemories);
router.post('/', verifyToken, isAdmin, upload.single('imageFile'), createMemory);
router.put('/order', verifyToken, isAdmin, updateMemoryOrder);
router.delete('/bulk', verifyToken, isAdmin, bulkDeleteMemories);

// 带参数的路由放在最后
router.get('/:id/image', getMemoryImage); // 原图
router.get('/:id/thumb', getMemoryThumbnail); // 缩略图（更小更快）
router.get('/:id', getMemory);
router.put('/:id', verifyToken, isAdmin, upload.single('imageFile'), updateMemory);
router.delete('/:id', verifyToken, isAdmin, deleteMemory);

module.exports = router;
