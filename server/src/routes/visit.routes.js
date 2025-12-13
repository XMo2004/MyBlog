const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visit.controller');

router.post('/', visitController.recordVisit);

module.exports = router;
