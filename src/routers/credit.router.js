const express = require('express');
const router = express.Router();
const creditController = require('../controllers/credit.controller');
const verifyToken = require('../middlewares/auth.middleware');

// Protect evaluation with token
router.post('/evaluate', verifyToken, creditController.evaluate);

module.exports = router;
