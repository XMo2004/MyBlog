const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { loginLimiter } = require('../middleware/rateLimit.middleware')
const auth = require('../middleware/auth.middleware');

router.post('/register', loginLimiter, authController.register);
router.post('/check', loginLimiter, authController.checkAvailability);
router.post('/send-code', loginLimiter, authController.sendVerificationCode);
router.post('/login', loginLimiter, authController.login);
router.get('/me', auth, authController.getMe);
router.put('/me', auth, authController.updateMe);

module.exports = router;
