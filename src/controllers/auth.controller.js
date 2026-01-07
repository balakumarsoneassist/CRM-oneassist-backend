const authService = require("../services/auth.service");

class AuthController {

    // =====================
    // Login
    // =====================
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    error: "Username and password required"
                });
            }

            const result = await authService.login(username, password);

            res.json({
                message: "Login successful",
                token: result.token,
                user: result.user
            });
        } catch (err) {
            console.error("Login Error:", err);

            if (
                err.message === "Invalid username" ||
                err.message === "Invalid password"
            ) {
                return res.status(401).json({ error: err.message });
            }

            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }

    // =====================
    // Logout
    // =====================
    async logout(req, res) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return res.status(401).json({
                    error: "No token provided"
                });
            }

            const token = authHeader.split(" ")[1];
            await authService.logout(token);

            res.json({ message: "Logout successful" });
        } catch (err) {
            console.error("Logout Error:", err);
            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }

    // =====================
    // Change Password
    // =====================
    async changePassword(req, res) {
        try {
            const { username, currentpassword, newpassword } = req.body;

            if (!username || !currentpassword || !newpassword) {
                return res.status(400).json({
                    error: "username, currentpassword, and newpassword are required"
                });
            }

            const result = await authService.changePassword(
                username,
                currentpassword,
                newpassword
            );

            res.json({
                message: "Password changed successfully",
                result
            });
        } catch (err) {
            console.error("Change Password Error:", err);

            if (
                err.message === "Invalid username" ||
                err.message === "Current password is incorrect"
            ) {
                return res.status(401).json({ error: err.message });
            }

            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }
}

module.exports = new AuthController();
