const express = require("express");
const router = express.Router();
const masterController = require("../controllers/master.controller");
const verifyToken = require("../middlewares/auth.middleware");

/**
 * ======================
 * PUBLIC ROUTES
 * ======================
 * (As per original behavior)
 */

// Bank Master (public)
router.post("/bankmaster", masterController.createBank);
router.put("/bankmaster/:id", masterController.updateBank);
router.get("/bankmaster", masterController.getBanks);
router.get("/bankmaster/:id", masterController.getBankById);

// Loan Master (public)
router.get("/getloanlist", masterController.getLoanList);

//Revenue Master (public)
router.get("/gettargetsbyemployee/:employeeId", masterController.getTargetsByEmployee);
router.post("/savetargets", masterController.saveTargets);
router.delete("/deletetarget/:employeeId", masterController.deleteTarget);
router.get("/getalltargets", masterController.getAllEmployeeTargets);
router.post("/updateProductRevenue", masterController.updateProductRevenue);
router.get("/getProductRevenue", masterController.getProductRevenue);

/**
 * ======================
 * PROTECTED ROUTES
 * ======================
 */

router.use(verifyToken);

/**
 * ---- Branch Master ----
 */
router.post("/branchmaster", masterController.createBranch);
router.put("/branchmaster/:id", masterController.updateBranch);
router.get("/branchmaster", masterController.getBranches);

/**
 * ---- Location Master ----
 */
router.post("/locationmaster", masterController.createLocation);
router.put("/locationmaster/:id", masterController.updateLocation);
router.get("/locationmaster", masterController.getLocations);

module.exports = router;
