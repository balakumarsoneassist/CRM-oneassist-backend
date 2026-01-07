const UserModel = require('../models/user.model');
const bcrypt = require('bcryptjs');
const tokenStore = require('../db/tokenStore');

class AuthService {
    async login(username, password) {
        const user = await UserModel.findByEmail(username);
        if (!user) {
            throw new Error('Invalid username');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid password');
        }
        if (user.password) delete user.password;
        const token = require('node:crypto').randomBytes(64).toString('hex');

        // Store token in tokenStore
        tokenStore.set(token, user);

        return { message: 'Login successful', user, token };
    }

    async logout(token) {
        if (token) {
            tokenStore.delete(token);
        }
    }

    async changePassword(username, currentpassword, newpassword) {
        const user = await UserModel.findById(username);
        // Original logic: "Invalid username" if not found. Note: username param here is actually ID in the controller call!
        if (!user) throw new Error('Invalid username');

        // Check isactive ?? Original query was `id=$1 and isactive=$2`.
        // UserModel.findById only checks ID.
        // I should strictly check isactive if strict adherence to original SQL is needed.
        // However, for change password, mostly active users do it.
        // Better safeguard:
        if (user.isactive !== true && user.isactive !== 'true') throw new Error('Invalid username');

        const isMatch = await bcrypt.compare(currentpassword, user.password);
        if (!isMatch) throw new Error('Current password is incorrect');

        const workFactor = 8;
        const hashedPassword = await new Promise((resolve, reject) => {
            bcrypt.genSalt(workFactor, function (err, salt) {
                if (err) { reject(err); return; }
                bcrypt.hash(newpassword, salt, function (err, hash) {
                    if (err) { reject(err); return; }
                    resolve(hash);
                });
            });
        });

        const updated = await UserModel.updatePassword(username, hashedPassword);
        if (!updated) throw new Error('Failed to update password');

        return { message: 'Password changed successfully', user: updated };
    }
}

module.exports = new AuthService();
