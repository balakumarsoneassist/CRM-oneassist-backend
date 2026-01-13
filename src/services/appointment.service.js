const employeeModel = require("../models/employee.model");

class AppointmentService {
    async getTodayAppointment(empid) {
        return await employeeModel.getTodayAppointment(empid);
    }

    async getAllTodayAppointment() {
        return await employeeModel.getAllTodayAppointment();
    }
}

module.exports = new AppointmentService();
