const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middlewares/auth.middleware');

// Note: Original index.js had routes like '/employees', '/employeesassignee'.
// I will mount this router at root in app.js for simplicity given the mix of paths.
// Or I can group them. 
// '/employees' -> POST, GET
// '/employees/:id' -> PUT, GET
// '/employeesassignee' -> GET

// I'll define full paths here and mount on '/' in app.js to match exact original paths without confusion.

router.get('/users', verifyToken, userController.getAllEmployees); // Sample route from original
router.get('/employees', verifyToken, userController.getAllEmployees);
router.post('/employees', verifyToken, userController.createEmployee);
router.put('/employees/:id', verifyToken, userController.updateEmployee);
router.get('/employeesassignee', verifyToken, userController.getEmployeesAssignee);
router.get('/employees/:id', verifyToken, userController.getEmployeeById);

module.exports = router;
