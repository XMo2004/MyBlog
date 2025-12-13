const express = require('express')
const router = express.Router()
const { verifyToken, isAdmin } = require('../middleware/auth.middleware')
const adminController = require('../controllers/admin.controller')

router.get('/stats', verifyToken, isAdmin, adminController.getStats)
router.get('/backups', verifyToken, isAdmin, adminController.listBackups)
router.post('/backup', verifyToken, isAdmin, adminController.backupDatabase)
router.post('/restore', verifyToken, isAdmin, adminController.restoreDatabase)
router.get('/logs', verifyToken, isAdmin, adminController.getLogs)
router.get('/me', verifyToken, isAdmin, adminController.getMe)
router.put('/me', verifyToken, isAdmin, adminController.updateMe)
router.get('/users', verifyToken, isAdmin, adminController.listUsers)
router.put('/users/:id/role', verifyToken, isAdmin, adminController.updateUserRole)
router.put('/users/:id/membership', verifyToken, isAdmin, adminController.updateUserMembership)
router.post('/users/batch-role', verifyToken, isAdmin, adminController.batchUpdateRole)
router.put('/users/:id/password', verifyToken, isAdmin, adminController.updateUserPassword)
router.delete('/users/:id', verifyToken, isAdmin, adminController.deleteUser)


module.exports = router
