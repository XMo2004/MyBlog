const express = require('express');
const router = express.Router();
const postController = require('../controllers/post.controller');
const { verifyToken, verifyTokenOptional, isAdmin, isEditorOrAdmin } = require('../middleware/auth.middleware');

const commentController = require('../controllers/comment.controller');

// Public routes
router.get('/', verifyTokenOptional, postController.getAllPosts);

// Protected routes (admin) - must be before /:id to prevent wrong matching
router.get('/admin/all', verifyToken, isAdmin, postController.getAllPostsAdmin);

// Dynamic routes
router.get('/:id', verifyTokenOptional, postController.getPostById);
router.post('/', verifyToken, isEditorOrAdmin, postController.createPost);
router.put('/:id', verifyToken, isEditorOrAdmin, postController.updatePost);
router.delete('/:id', verifyToken, isEditorOrAdmin, postController.deletePost);

router.post('/bulk-delete', verifyToken, isAdmin, postController.bulkDeletePosts);

router.post('/:postId/comments', verifyToken, commentController.addComment);

module.exports = router;
