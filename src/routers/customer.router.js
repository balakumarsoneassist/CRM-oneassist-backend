const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');

// No verifyToken
router.post('/customers', customerController.createCustomer);
router.get('/gettodayappoinment/:empid', customerController.getTodayAppointment);
router.get('/getcustomerlist', customerController.getCustomerList);

module.exports = router;
