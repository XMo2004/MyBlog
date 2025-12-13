const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tag.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', tagController.getAllTags);
router.get('/public', tagController.getPublicTags);
router.post('/', verifyToken, isAdmin, tagController.createTag);
router.put('/:id', verifyToken, isAdmin, tagController.updateTag);
router.delete('/:id', verifyToken, isAdmin, tagController.deleteTag);
router.post('/bulk-delete', verifyToken, isAdmin, tagController.bulkDeleteTags);

module.exports = router;
