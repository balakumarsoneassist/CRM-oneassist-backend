const express = require("express");
const router = express.Router();
const qrController = require("../controllers/qrcode.controller");
const verifyToken = require("../middlewares/auth.middleware");

/**
 * ======================
 * PUBLIC ROUTES
 * ======================
 */

// Save QR code customers (public)
router.post("/saveqrcodecustomers", qrController.saveQRCodeCustomers);

// Save QR response (public)
router.post("/saveqrresponse", qrController.saveQRResponse);


/**
 * ======================
 * PROTECTED ROUTES
 * ======================
 */

// Get QR response list (secured)
router.get("/getqrresponselist", verifyToken, qrController.getQRResponseList);

module.exports = router;
