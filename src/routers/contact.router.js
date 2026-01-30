const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const verifyToken = require('../middlewares/auth.middleware');

router.get('/unassignedcontacts/:orgid', verifyToken, contactController.getUnassignedContacts);
router.get('/assignedcontacts/:userid/:orgid', verifyToken, contactController.getAssignedContacts);
router.get('/trackcontacts/:userid/:orgid', verifyToken, contactController.getTrackContacts);
router.get('/trackleads/:userid/:orgid', verifyToken, contactController.getTrackLeads);
router.get('/unassignedleads/:orgid', verifyToken, contactController.getUnassignedLeads);
router.get('/assignedleads/:userid/:orgid', verifyToken, contactController.getAssignedLeads);
router.get('/allassignedcontacts/:orgid', verifyToken, contactController.getAllAssignedContacts);
router.post('/reassignassignedcontacts', verifyToken, contactController.reassignAssignedContact);
router.get('/alltrackedcontacts/:orgid', verifyToken, contactController.getAllTrackedContacts);


module.exports = router;
