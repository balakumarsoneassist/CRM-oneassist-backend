const employeeModel = require("../models/employee.model");

class EmployeeService {
    async getAllEmployees() {
        return await employeeModel.findAll();
    }

    async getAssignees() {
        return await employeeModel.findAssignees();
    }

    async getEmployeeById(id) {
        const employee = await employeeModel.findById(id);
        if (!employee) throw { status: 404, message: "Employee not found" };
        return employee;
    }

    async createEmployee(data) {
        const { emailid, name } = data;
        if (!emailid || !name) throw { status: 400, message: "emailid and name required" };

        // Constant hash for "oneassist@123" as per original implementation
        const hashedPassword = "$2a$08$ONRqbLt2mhzK70YbnA.SIOyUMeDZ1iIgm/CYebM08n3YRE7pnRgGy";

        return await employeeModel.create({ ...data, password: hashedPassword });
    }

    async updateEmployee(id, data) {
        const fields = [
            "name", "qualification", "dateofbirth", "joindate", "presentaddress", "permanentaddress",
            "emailid", "designation", "mobilenumber", "contactperson", "contactnumber", "logintime",
            "isactive", "isadminrights", "isleadrights", "iscontactrights", "iscibilrights",
            "isicicirights", "organizationid", "dept", "issplrights", "isreassignrights", "image_data"
        ];

        const updateData = {};
        fields.forEach(field => {
            if (data[field] !== undefined) {
                updateData[field] = data[field];
            }
        });

        if (Object.keys(updateData).length === 0) throw { status: 400, message: "Nothing to update" };

        const employee = await employeeModel.update(id, updateData);
        if (!employee) throw { status: 404, message: "Employee not found" };
        return employee;
    }

    async getUsers() {
        return await employeeModel.findAll();
    }
}

module.exports = new EmployeeService();
