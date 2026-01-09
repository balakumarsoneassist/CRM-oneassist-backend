const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const verifyToken = require("../middlewares/auth.middleware");

/**
 * ======================
 * PUBLIC ROUTES
 * ======================
 */

// Create customer (example: lead capture / public form)
router.post("/customers", customerController.createCustomer);

// Get today's appointment (if intentionally public)
router.get("/gettodayappoinment/:empid", customerController.getTodayAppointment);


/**
 * ======================
 * PROTECTED ROUTES
 * ======================
 */

router.use(verifyToken);

// Contacts and Leads are handled in contact.router.js

// Customers & Loans
router.get("/getcustomerlist", customerController.getCustomerList);
router.post("/customers/reassign/:id", customerController.reassignCustomer);
router.post("/customers/bulk-assign", customerController.bulkAssignUnassigned);
router.post("/customers/reassign-to-employee", customerController.reassignToEmployee);
router.get("/customers/:id/timeline", customerController.getTimeline);

module.exports = router;
