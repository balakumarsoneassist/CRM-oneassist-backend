const appointmentService = require("../services/appointment.service");

class AppointmentController {
    async getTodayAppointment(req, res) {
        try {
            const data = await appointmentService.getTodayAppointment(req.params.empid);
            res.json({ success: true, count: data.length, data });
        } catch (err) {
            console.error("Error in getTodayAppointment:", err);
            res.status(err.status || 500).json({ error: err.message || "Internal server error" });
        }
    }

    async getAllTodayAppointment(req, res) {
        try {
            const data = await appointmentService.getAllTodayAppointment();
            res.json({ success: true, count: data.length, data });
        } catch (err) {
            console.error("Error in getAllTodayAppointment:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = new AppointmentController();
