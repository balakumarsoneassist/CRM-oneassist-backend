const express = require("express");
const router = express.Router();
const utilityController = require("../controllers/utility.controller");

router.post("/changepassword", utilityController.changePassword);

module.exports = router;
