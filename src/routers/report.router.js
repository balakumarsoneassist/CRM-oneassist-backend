const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report.controller");
const verifyToken = require("../middlewares/auth.middleware");

// Secure all report routes
router.use(verifyToken);

/**
 * ======================
 * PUBLIC REPORT ROUTES
 * ======================
 * (As per original index.js logic)
 */

router.get("/getoverallstatus/:orgid", reportController.getOverallStatus);
router.get(
  "/LeadFollowallStatusRportSummaryList",
  reportController.getLeadFollowAllStatusReport
);
router.get(
  "/ContactFollowallStatusRportSummaryList",
  reportController.getContactFollowAllStatusReport
);
router.get(
  "/LCFollowEmpStatusRportSummaryList",
  reportController.getLCFollowEmpStatusReport
);

/**
 * ======================
 * PROTECTED REPORT ROUTES
 * ======================
 */

router.get("/getuserreport", reportController.getUserReport);
router.get("/getdashboarduser/:empid", reportController.getDashboardUser);
router.get("/getdashboardadmin", reportController.getDashboardAdmin);

module.exports = router;
