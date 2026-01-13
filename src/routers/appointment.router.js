const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.use(verifyToken);

router.get("/gettodayappoinment/:empid", appointmentController.getTodayAppointment);
router.get("/getalltodayappointment", appointmentController.getAllTodayAppointment);

module.exports = router;
