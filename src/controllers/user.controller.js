const UserService = require('../services/user.service');

exports.getAllEmployees = async (req, res) => {
    try {
        const users = await UserService.getAll();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getEmployeesAssignee = async (req, res) => {
    try {
        const users = await UserService.getAssignees();
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getEmployeeById = async (req, res) => {
    try {
        const user = await UserService.getById(req.params.id);
        if (!user) return res.status(404).json({ error: 'Employee not found' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createEmployee = async (req, res) => {
    const { emailid, name } = req.body;
    if (!emailid || !name) {
        return res.status(400).json({ error: 'emailid and name required' });
    }
    try {
        const user = await UserService.create(req.body);
        res.status(201).json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateEmployee = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await UserService.update(id, req.body);
        if (!user) return res.status(404).json({ error: 'Employee not found' });
        res.json(user);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
