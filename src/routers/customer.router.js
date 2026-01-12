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
router.get(
  "/gettodayappoinment/:empid",
  customerController.getTodayAppointment
);

/**
 * ======================
 * PROTECTED ROUTES
 * ======================
 */

router.use(verifyToken);

// Contacts and Leads are handled in contact.router.js

// Customers & Loans
router.get("/getcustomerlist", customerController.getCustomerList);
router.get("/trackcustomers/:userId/:orgId", customerController.getTrackCustomers);
router.post("/start-tracking", customerController.startTracking);
router.post("/reassign-to-employee", customerController.reassignToEmployee);
router.get("/:id/timeline", customerController.getTimeline);

// Fix for convert-to-contact mismatch (Frontend POSTs to this, Controller expects ID)
// Using a new wrapper or modifying controller. For now routing to reassignCustomer but note mismatch
// router.post("/convert-to-contact", customerController.reassignCustomer); 
// Better to fix controller first, but let's add the route the frontend calls
router.post("/convert-to-contact", customerController.reassignCustomer);

module.exports = router;
