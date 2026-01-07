const utilityService = require("../services/utility.service");

class UtilityController {
    async changePassword(req, res) {
        try {
            const { username, currentpassword, newpassword } = req.body;
            const data = await utilityService.changePassword(username, currentpassword, newpassword);
            res.json({ message: "Password changed successfully", user: data });
        } catch (err) {
            console.error("Error in changePassword:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }
}

module.exports = new UtilityController();
