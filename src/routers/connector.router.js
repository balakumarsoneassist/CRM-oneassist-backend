const express = require('express');
const router = express.Router();
const connectorController = require('../controllers/connector.controller');

// No verifyToken
router.post('/connector', connectorController.createConnector);
router.put('/connector/:id', connectorController.updateConnector);
router.get('/connector/:id', connectorController.getConnectorById);
router.get('/getconnectorlist', connectorController.getConnectorList);
router.post('/connectorlogin', connectorController.connectorLogin);
router.post('/connectorcontact', connectorController.createConnectorContact);

module.exports = router;
