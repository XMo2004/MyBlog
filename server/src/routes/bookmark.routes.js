const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmark.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(verifyToken);

// Collection routes
router.get('/collections', bookmarkController.getCollections);
router.post('/collections', bookmarkController.createCollection);
router.put('/collections/:id', bookmarkController.updateCollection);
router.delete('/collections/:id', bookmarkController.deleteCollection);

// Bookmark routes
router.get('/', bookmarkController.getBookmarks);
router.post('/', bookmarkController.addBookmark);
router.post('/toggle', bookmarkController.toggleBookmark);
router.put('/:id', bookmarkController.updateBookmark);
router.delete('/:id', bookmarkController.removeBookmark);
router.delete('/post/:postId', bookmarkController.removeBookmarkByPost);
router.get('/check/:postId', bookmarkController.checkBookmarkStatus);

module.exports = router;
