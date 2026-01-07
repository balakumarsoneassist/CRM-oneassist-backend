const express = require('express');
const router = express.Router();
const masterController = require('../controllers/master.controller');
const verifyToken = require('../middlewares/auth');

// Branch
router.post('/branchmaster', verifyToken, masterController.createBranch);
router.put('/branchmaster/:id', verifyToken, masterController.updateBranch);
router.get('/branchmaster', verifyToken, masterController.getBranches);

// Location
router.post('/locationmaster', verifyToken, masterController.createLocation);
router.put('/locationmaster/:id', verifyToken, masterController.updateLocation);
router.get('/locationmaster', verifyToken, masterController.getLocations);

// Bank (No verifyToken in original for bankmaster routes)
router.post('/bankmaster', masterController.createBank);
router.put('/bankmaster/:id', masterController.updateBank);
router.get('/bankmaster', masterController.getBanks);
router.get('/bankmaster/:id', masterController.getBankById);

// Loan
router.get('/getloanlist', masterController.getLoanList);

module.exports = router;
