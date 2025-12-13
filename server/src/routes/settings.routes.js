const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/', settingsController.getSettings);
router.put('/', verifyToken, isAdmin, settingsController.updateSettings);

module.exports = router;
