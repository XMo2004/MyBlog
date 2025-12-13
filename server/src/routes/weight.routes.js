const express = require('express');
const router = express.Router();
const weightController = require('../controllers/weight.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/', weightController.getWeights);
router.post('/', verifyToken, isAdmin, weightController.addWeight);
router.delete('/:id', verifyToken, isAdmin, weightController.deleteWeight);

module.exports = router;
