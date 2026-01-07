const express = require('express');
const router = express.Router();
const leadController = require('../controllers/lead.controller');
const verifyToken = require('../middlewares/auth');

// Personal
router.post('/leadpersonal', verifyToken, leadController.saveLeadPersonal);
router.get('/leadpersonal', verifyToken, leadController.getLeadPersonalList);
router.get('/leadpersonal/:id', verifyToken, leadController.getLeadPersonalById);
router.put('/leadpersonal/:id', verifyToken, leadController.updateLeadPersonal);

// Occupation
router.post('/leadoccupationdetails', verifyToken, leadController.saveLeadOccupation);
router.put('/leadoccupationdetails/:id', verifyToken, leadController.updateLeadOccupation);
router.get('/leadoccupationdetails/:leadpersonal', verifyToken, leadController.getLeadOccupationByLeadPersonal);

// Bank
router.post('/leadbankdetails', verifyToken, leadController.saveLeadBank);
router.put('/leadbankdetails/:id', verifyToken, leadController.updateLeadBank);
router.get('/leadbankdetails/:leadpersonal', verifyToken, leadController.getLeadBankByLeadPersonal);

// Loan History
router.post('/leadloanhistorydetails', verifyToken, leadController.saveLeadLoanHistory);
router.put('/leadloanhistorydetails/:id', verifyToken, leadController.updateLeadLoanHistory);
router.get('/leadloanhistorydetails/:leadpersonal', verifyToken, leadController.getLeadLoanHistoryByLeadPersonal);

// Track
router.post('/saveleadtrackhistorydetails', verifyToken, leadController.saveLeadTrackHistory);
router.post('/saveleadtrackdetails', verifyToken, leadController.saveLeadTrackDetails);
router.post('/saveleadtrackdetails/:tracknumber', verifyToken, leadController.updateLeadTrackDetails);

// Note: In index.js callhistorytracklist and getleadtrackdetails did NOT have verifyToken.
// I'll keep them consistent with previous findings (no verifyToken).
router.get('/callhistorytracklist/:tracknumber', leadController.getCallHistoryTrackList);
router.get('/getleadtrackdetails/:tracknumber', leadController.getLeadTrackDetails);

module.exports = router;
