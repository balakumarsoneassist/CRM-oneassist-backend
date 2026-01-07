const tokenStore = require("../db/tokenStore");

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    console.log(`[Auth] Checking token for ${req.method} ${req.originalUrl}`);

    // EXEMPTION: Public Webhooks
    if (req.originalUrl.includes('webhook')) {
        console.log(`>>> [Auth] BYPASSING verification for public webhook: ${req.originalUrl}`);
        return next();
    }

    // Check Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("❌ Authentication failed: Missing or invalid Authorization header");
        return res.status(401).json({
            error: "Access denied. No valid Bearer token provided.",
            message: "Please include Authorization: Bearer <token> in your request headers"
        });
    }

    // Extract token
    const token = authHeader.substring(7);

    // Basic token validation
    if (!token || token.length < 10) {
        console.log("❌ Authentication failed: Invalid token format (too short)");
        return res.status(401).json({
            error: "Invalid token format"
        });
    }

    // Check token in store (session validation)
    const user = tokenStore.get(token);
    if (!user) {
        console.log("❌ Authentication failed: Session not found or expired");
        return res.status(401).json({
            error: "Session expired",
            message: "Please login again"
        });
    }

    // Attach to request
    req.user = user;
    req.token = token;

    console.log(`✅ Authentication successful for user: ${user.username || user.id || "unknown"}`);
    next();
}

module.exports = verifyToken;
