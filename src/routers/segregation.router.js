const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customer.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.use(verifyToken);

router.get("/customers/all", customerController.getAllCustomers);

module.exports = router;
