const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/public', categoryController.getPublicCategories);
router.get('/tree', categoryController.getCategoryTree);

// Protected routes
router.get('/', verifyToken, isAdmin, categoryController.getAllCategories);
router.post('/', verifyToken, isAdmin, categoryController.createCategory);
router.put('/:id', verifyToken, isAdmin, categoryController.updateCategory);
router.delete('/:id', verifyToken, isAdmin, categoryController.deleteCategory);
router.post('/bulk-delete', verifyToken, isAdmin, categoryController.bulkDeleteCategories);

module.exports = router;
