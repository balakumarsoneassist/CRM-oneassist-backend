const employeeService = require("../services/employee.service");

class EmployeeController {
    async getAllEmployees(req, res) {
        try {
            const data = await employeeService.getAllEmployees(req.query);
            res.json(data);
        } catch (err) {
            console.error("Error in getAllEmployees:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }

    async getEmployeeById(req, res) {
        try {
            const data = await employeeService.getEmployeeById(req.params.id);
            res.json(data);
        } catch (err) {
            console.error("Error in getEmployeeById:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }

    async createEmployee(req, res) {
        try {
            const data = await employeeService.createEmployee(req.body);
            res.status(201).json(data);
        } catch (err) {
            console.error("Error in createEmployee:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }

    async updateEmployee(req, res) {
        try {
            const data = await employeeService.updateEmployee(req.params.id, req.body);
            res.json(data);
        } catch (err) {
            console.error("Error in updateEmployee:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }

    async getUsers(req, res) {
        try {
            const data = await employeeService.getUsers(req.params.orgid);
            res.json(data);
        } catch (err) {
            console.error("Error in getUsers:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }

    async getAssignees(req, res) {
        try {
            const data = await employeeService.getAssignees(req.params.orgid);
            res.json(data);
        } catch (err) {
            console.error("Error in getAssignees:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }
}

module.exports = new EmployeeController();
