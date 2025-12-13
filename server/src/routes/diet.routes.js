const express = require('express')
const router = express.Router()
const dietController = require('../controllers/diet.controller')
const { verifyToken, isAdmin } = require('../middleware/auth.middleware')

router.get('/', dietController.getDietByDate)
router.post('/', verifyToken, isAdmin, dietController.createDiet)
router.put('/:id', verifyToken, isAdmin, dietController.updateDiet)
router.delete('/:id', verifyToken, isAdmin, dietController.deleteDiet)

module.exports = router

