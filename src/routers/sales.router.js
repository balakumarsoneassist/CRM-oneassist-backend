const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');

// No verifyToken used in original index.js for these routes
router.post('/savesalesvisit', salesController.saveSalesVisit);
router.post('/savesalesvisittrack', salesController.saveSalesVisitTrack);
router.get('/svcustomerlist/:empid', salesController.getSVCustomerList);
router.get('/getsvcustlist/:custid', salesController.getSVCustListByCustId);
router.put('/updatesvcustomer/:id', salesController.updateSVCustomer);
router.get('/svallcustomers', salesController.getSVAllCustomers);
router.get('/svcustomersbyemp/:empid', salesController.getSVCustomersByEmp);

module.exports = router;
