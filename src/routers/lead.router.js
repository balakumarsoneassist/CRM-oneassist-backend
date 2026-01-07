const express = require("express");
const router = express.Router();
const leadController = require("../controllers/lead.controller");
const verifyToken = require("../middlewares/auth.middleware");

/**
 * ======================
 * PUBLIC ROUTES
 * ======================
 * (Kept public as per your note in index.js)
 */

// Call history & lead tracking details (public)
router.get("/callhistorytracklist/:tracknumber", leadController.getCallHistoryTrackList);
router.get("/getleadtrackdetails/:tracknumber", leadController.getLeadTrackDetails);


/**
 * ======================
 * PROTECTED ROUTES
 * ======================
 */

router.use(verifyToken);

/**
 * ---- Lead Personal Details ----
 */
router.post("/leadpersonaldetails", leadController.createLeadPersonal);
router.get("/leadpersonaldetails", leadController.getLeadPersonal);
router.get("/leadpersonaldetails/:id", leadController.getLeadPersonalById);
router.put("/leadpersonaldetails/:id", leadController.updateLeadPersonal);

/**
 * ---- Lead Occupation Details ----
 */
router.post("/leadoccupationdetails", leadController.createLeadOccupation);
router.put("/leadoccupationdetails/:id", leadController.updateLeadOccupation);
router.get(
  "/leadoccupationdetails/:leadpersonal",
  leadController.getLeadOccupationByLeadPersonal
);

/**
 * ---- Lead Bank Details ----
 */
router.post("/leadbankdetails", leadController.createLeadBank);
router.put("/leadbankdetails/:id", leadController.updateLeadBank);
router.get(
  "/leadbankdetails/:leadpersonal",
  leadController.getLeadBankByLeadPersonal
);

/**
 * ---- Lead Loan History Details ----
 */
router.post("/leadloanhistorydetails", leadController.createLeadLoanHistory);
router.put("/leadloanhistorydetails/:id", leadController.updateLeadLoanHistory);
router.get(
  "/leadloanhistorydetails/:leadpersonal",
  leadController.getLeadLoanHistoryByLeadPersonal
);

/**
 * ---- Lead Tracking ----
 */
router.post("/saveleadtrackhistorydetails", leadController.saveLeadTrackHistory);
router.post("/saveleadtrackdetails", leadController.saveLeadTrackDetails);
router.post(
  "/saveleadtrackdetails/:tracknumber",
  leadController.updateLeadTrackDetails
);

module.exports = router;
