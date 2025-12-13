const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resource.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/', resourceController.getResources);
router.post('/', verifyToken, isAdmin, resourceController.createResource);
router.put('/:id', verifyToken, isAdmin, resourceController.updateResource);
router.delete('/:id', verifyToken, isAdmin, resourceController.deleteResource);
router.post('/bulk-delete', verifyToken, isAdmin, resourceController.bulkDeleteResources);

module.exports = router;
