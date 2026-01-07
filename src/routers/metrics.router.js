const express = require("express");
const router = express.Router();
const metricsController = require("../controllers/metrics.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.use(verifyToken);

router.get("/all-achievement-metrics", metricsController.getAllAchievementMetrics);
router.get("/target-achievement", metricsController.getAllAchievementMetrics); // Alias for frontend compat
router.get("/target-metrics", metricsController.getTargetMetrics);
router.put("/target-metrics/:employeeId", metricsController.updateTargetMetrics);
router.get("/target-assignment-status", metricsController.getTargetAssignmentStatus);

module.exports = router;
