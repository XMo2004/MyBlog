const express = require('express');
const router = express.Router();
const columnController = require('../controllers/column.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/', columnController.getColumns);
router.get('/:id/tree', columnController.getColumnTree);
router.post('/', verifyToken, isAdmin, columnController.createColumn);
router.put('/:id', verifyToken, isAdmin, columnController.updateColumn);
router.delete('/:id', verifyToken, isAdmin, columnController.deleteColumn);
router.post('/bulk-delete', verifyToken, isAdmin, columnController.bulkDeleteColumns);

// Node management
router.post('/:id/nodes', verifyToken, isAdmin, columnController.createNode);
router.put('/nodes/:nodeId', verifyToken, isAdmin, columnController.updateNode);
router.delete('/nodes/:nodeId', verifyToken, isAdmin, columnController.deleteNode);


module.exports = router;
