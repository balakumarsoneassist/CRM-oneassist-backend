const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsapp.controller');
const verifyToken = require('../middlewares/auth.middleware');

console.log('--- (1) WhatsApp Router loaded ---');

router.get('/webhook', whatsappController.verifyWebhook);
router.post('/webhook', whatsappController.handleWebhook);
router.post('/send-verification', verifyToken, whatsappController.sendVerification);
router.post('/send-template', verifyToken, whatsappController.sendTemplateMessage);
router.get('/test-route', (req, res) => res.send('✅ WhatsApp Router is Active and Mounted at /api/whatsapp'));
router.get('/status/:mobile', verifyToken, whatsappController.getStatus);
router.get('/force-verify/:mobile', whatsappController.forceVerify);

module.exports = router;
