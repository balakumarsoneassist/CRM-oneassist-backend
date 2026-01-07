const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrcode.controller');

// No verifyToken
router.post('/saveqrcodecustomers', qrController.saveQRCodeCustomers);
router.post('/saveqrresponse', qrController.saveQRResponse);
router.get('/getqrresponselist', qrController.getQRResponseList);

module.exports = router;
