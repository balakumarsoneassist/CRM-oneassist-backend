function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(`[Auth] Checking token for ${req.method} ${req.url}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ No valid Bearer token provided. Header:', authHeader ? 'Present but invalid' : 'Missing');
        return res.status(401).json({
            error: 'Access denied. No valid Bearer token provided.',
            message: 'Please include Authorization: Bearer <token> in your request headers'
        });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (token.length < 10) {
        console.log('❌ Invalid token format (too short)');
        return res.status(401).json({ error: 'Invalid token format' });
    }

    req.token = token;
    next();
}

module.exports = verifyToken;
