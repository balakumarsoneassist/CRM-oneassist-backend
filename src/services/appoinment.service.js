const employeeModel = require("../models/employee.model");

class AppointmentService {
    async getTodayAppointment(empid) {
        if (!empid || isNaN(parseInt(empid))) throw { status: 400, message: "Valid employee ID is required" };
        return await employeeModel.getTodayAppointment(parseInt(empid));
    }
}

module.exports = new AppointmentService();
