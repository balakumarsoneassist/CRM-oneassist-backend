const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employee.controller");
const verifyToken = require("../middlewares/auth.middleware");

router.use(verifyToken);

router.post("/employeedetails", employeeController.createEmployee);
router.put("/employeedetails/:id", employeeController.updateEmployee);
router.get("/employeedetails", employeeController.getAllEmployees);
router.get("/employeedetails/:id", employeeController.getEmployeeById);
router.get("/getusers/:orgid", employeeController.getUsers);
router.get("/getassignactiveuser/:orgid", employeeController.getAssignees);

module.exports = router;
