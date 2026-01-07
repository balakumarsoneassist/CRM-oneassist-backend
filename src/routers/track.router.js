const express = require("express");
const router = express.Router();
const trackController = require("../controllers/track.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.use(verifyToken);

router.post("/saveleadtrackhistorydetails", trackController.saveLeadTrackHistory);
router.post("/saveleadtrackdetails", trackController.saveLeadTrackDetails);
router.post("/saveleadtrackdetails/:tracknumber", trackController.updateLeadTrackDetails);
router.get("/callhistorytracklist/:tracknumber", trackController.getCallHistory);
router.get("/getleadtrackdetails/:tracknumber", trackController.getLeadTrackDetails);
router.get("/getoverallstatus/:orgid", trackController.getOverallStatus);
router.get("/LeadFollowallStatusRportSummaryList", trackController.getLeadFollowedByAll);
router.get("/ContactFollowallStatusRportSummaryList", trackController.getContactFollowedByAll);

module.exports = router;
