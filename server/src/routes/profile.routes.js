const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

router.get('/', profileController.getProfile);
router.put('/', verifyToken, isAdmin, profileController.updateProfile);

module.exports = router;
