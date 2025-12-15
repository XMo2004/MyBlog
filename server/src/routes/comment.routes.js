const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// 管理员评论管理路由
router.get('/admin/all', verifyToken, isAdmin, commentController.getAllComments);
router.get('/admin/stats', verifyToken, isAdmin, commentController.getCommentStats);
router.delete('/admin/:id', verifyToken, isAdmin, commentController.deleteComment);
router.post('/admin/bulk-delete', verifyToken, isAdmin, commentController.bulkDeleteComments);

// 用户操作
router.post('/:commentId/like', verifyToken, commentController.toggleLike);

module.exports = router;
