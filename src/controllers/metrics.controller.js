const metricsService = require("../services/metrics.service");

class MetricsController {
    async getAllAchievementMetrics(req, res) {
        try {
            if (!req.user || !req.user.isadminrights) return res.status(403).json({ error: "Access denied" });
            const result = await metricsService.getAllAchievementMetrics();
            res.json({
                success: true,
                data: result.data,
                totals: result.totals,
                totalCount: result.totalCount
            });
        } catch (err) {
            console.error("Error in getAllAchievementMetrics:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }

    async getTargetMetrics(req, res) {
        try {
            let targetId = req.query.employeeId || req.user?.id;

            // Enforce: Non-admins can only see their own metrics
            if (!req.user?.isadminrights) {
                targetId = req.user.id;
            }

            if (!targetId) return res.status(400).json({ error: "Employee ID not provided" });
            const data = await metricsService.getTargetMetrics(targetId);
            res.json({ success: true, data });
        } catch (err) {
            console.error("Error in getTargetMetrics:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }

    async updateTargetMetrics(req, res) {
        try {
            if (!req.user || !req.user.isadminrights) return res.status(403).json({ error: "Access denied" });
            const data = await metricsService.updateTargetMetrics(req.params.employeeId, req.body);
            res.json({ success: true, message: "Target metrics assigned successfully", data });
        } catch (err) {
            console.error("Error in updateTargetMetrics:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }

    async getTargetAssignmentStatus(req, res) {
        try {
            if (!req.user || !req.user.isadminrights) return res.status(403).json({ error: "Access denied" });
            const data = await metricsService.getTargetAssignmentStatus();
            res.json(data);
        } catch (err) {
            console.error("Error in getTargetAssignmentStatus:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }
}

module.exports = new MetricsController();
