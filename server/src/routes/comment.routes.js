const express = require('express');
const router = express.Router();
const commentController = require('../controllers/comment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/:commentId/like', verifyToken, commentController.toggleLike);

module.exports = router;
