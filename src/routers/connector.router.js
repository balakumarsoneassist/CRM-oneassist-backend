const express = require('express');
const router = express.Router();
const connectorController = require('../controllers/connector.controller');
const verifyToken = require("../middlewares/auth.middleware");

// Public login
router.post("/connectorlogin", connectorController.connectorLogin);

// No verifyToken
router.post('/connector', verifyToken, connectorController.createConnector);
router.put('/connector/:id', verifyToken, connectorController.updateConnector);
router.get('/connector/:id', verifyToken, connectorController.getConnectorById);
router.get('/getconnectorlist', verifyToken, connectorController.getConnectorList);
router.post('/connectorcontact', verifyToken, connectorController.createConnectorContact);

module.exports = router;
