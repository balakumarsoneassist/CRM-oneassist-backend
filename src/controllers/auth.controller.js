const AuthService = require('../services/auth.service');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    try {
        const result = await AuthService.login(username, password);
        res.json(result);
    } catch (err) {
        if (err.message === 'Invalid username' || err.message === 'Invalid password') {
            return res.status(401).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.changePassword = async (req, res) => {
    const { username, currentpassword, newpassword } = req.body;
    if (!username || !currentpassword || !newpassword) return res.status(400).json({ error: 'username, currentpassword, and newpassword are required' });
    try {
        const result = await AuthService.changePassword(username, currentpassword, newpassword);
        res.json(result);
    } catch (err) {
        if (err.message === 'Invalid username' || err.message === 'Current password is incorrect') {
            return res.status(401).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
