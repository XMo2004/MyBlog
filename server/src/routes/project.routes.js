const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/', projectController.getProjects);
router.post('/', verifyToken, isAdmin, projectController.createProject);
router.put('/:id', verifyToken, isAdmin, projectController.updateProject);
router.delete('/:id', verifyToken, isAdmin, projectController.deleteProject);
router.post('/bulk-delete', verifyToken, isAdmin, projectController.bulkDeleteProjects);

module.exports = router;
