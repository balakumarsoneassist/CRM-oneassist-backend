const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.use(verifyToken);

router.get("/customers/all", customerController.getAllCustomers);
router.post("/customers/reassign/:id", customerController.reassignCustomer);
router.post("/customers/bulk-assign", customerController.bulkAssignUnassigned);
router.post(
  "/customers/reassign-to-employee",
  customerController.reassignToEmployee
);
router.get("/customers/:id/timeline", customerController.getTimeline);

module.exports = router;
