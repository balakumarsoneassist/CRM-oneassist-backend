const UserModel = require('../models/user.model');

class UserService {
    async getAll() {
        return await UserModel.findAll();
    }

    async getAssignees() {
        return await UserModel.findAssignees();
    }

    async getById(id) {
        return await UserModel.findById(id);
    }

    async create(data) {
        // Business logic: generating default password hash
        let hashedPassword = '$2a$08$ONRqbLt2mhzK70YbnA.SIOyUMeDZ1iIgm/CYebM08n3YRE7pnRgGy';
        return await UserModel.create(data, hashedPassword);
    }

    async update(id, data) {
        return await UserModel.update(id, data);
    }
}

module.exports = new UserService();
