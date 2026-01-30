const masterService = require("../services/master.service");

class MasterController {

    // =========================
    // Branch
    // =========================
    async createBranch(req, res) {
        try {
            const { location, name, isactive } = req.body;

            if (!location || !name || typeof isactive === "undefined") {
                return res.status(400).json({
                    error: "location, name and isactive required"
                });
            }

            const data = await masterService.createBranch(req.body);
            res.status(201).json(data);
        } catch (err) {
            console.error("Error in createBranch:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateBranch(req, res) {
        try {
            const { id } = req.params;
            const { location, name, isactive } = req.body;

            if (
                typeof location === "undefined" &&
                typeof name === "undefined" &&
                typeof isactive === "undefined"
            ) {
                return res.status(400).json({ error: "Nothing to update" });
            }

            const data = await masterService.updateBranch(id, req.body);

            if (!data) {
                return res.status(404).json({ error: "Branch not found" });
            }

            res.json(data);
        } catch (err) {
            console.error("Error in updateBranch:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getBranches(req, res) {
        try {
            const data = await masterService.getBranches(req.query);
            res.json(data);
        } catch (err) {
            console.error("Error in getBranches:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Location
    // =========================
    async createLocation(req, res) {
        try {
            const { location, state } = req.body;

            if (!location || !state) {
                return res.status(400).json({
                    error: "location and state required"
                });
            }

            const data = await masterService.createLocation(req.body);
            res.status(201).json(data);
        } catch (err) {
            console.error("Error in createLocation:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateLocation(req, res) {
        try {
            const { id } = req.params;
            const { location, state } = req.body;

            if (
                typeof location === "undefined" &&
                typeof state === "undefined"
            ) {
                return res.status(400).json({ error: "Nothing to update" });
            }

            const data = await masterService.updateLocation(id, req.body);

            if (!data) {
                return res.status(404).json({ error: "Location not found" });
            }

            res.json(data);
        } catch (err) {
            console.error("Error in updateLocation:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getLocations(req, res) {
        try {
            const data = await masterService.getLocations(req.query);
            res.json(data);
        } catch (err) {
            console.error("Error in getLocations:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Bank
    // =========================
    async createBank(req, res) {
        try {
            const { bankname } = req.body;

            if (!bankname) {
                return res.status(400).json({
                    error: "bankname is required"
                });
            }

            const data = await masterService.createBank(req.body);
            res.status(201).json(data);
        } catch (err) {
            console.error("Error in createBank:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateBank(req, res) {
        try {
            const { id } = req.params;
            const { bankname } = req.body;

            if (!id || !bankname) {
                return res.status(400).json({
                    error: "id and bankname required"
                });
            }

            const data = await masterService.updateBank(id, req.body);

            if (!data) {
                return res.status(404).json({ error: "Record not found" });
            }

            res.json(data);
        } catch (err) {
            console.error("Error in updateBank:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getBanks(req, res) {
        try {
            const data = await masterService.getBanks();
            res.json(data);
        } catch (err) {
            console.error("Error in getBanks:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getBankById(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: "id is required" });
            }

            const data = await masterService.getBankById(id);

            if (!data) {
                return res.status(404).json({ error: "Record not found" });
            }

            res.json(data);
        } catch (err) {
            console.error("Error in getBankById:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Loan
    // =========================
    async getLoanList(req, res) {
        try {
            const data = await masterService.getLoanList();
            res.json({
                success: true,
                count: data.length,
                data
            });
        } catch (err) {
            console.error("Error in getLoanList:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateProductRevenue(req, res) {
        try {
            const rows = req.body;

            if (!Array.isArray(rows) || rows.length === 0) {
                return res.status(400).json({ error: 'Payload must be a non-empty array' });
            }

            // Validate each row
            for (const row of rows) {
                const { productName, selfPercent, connectorPercent } = row;

                if (
                    !productName ||
                    selfPercent === undefined ||
                    connectorPercent === undefined
                ) {
                    return res.status(400).json({ error: 'Invalid row data' });
                }
            }

            const response = await masterService.updateProductRevenue(rows);

            return res.status(200).json({ response, message: 'Saved successfully' });

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }


    async saveTargets(req, res) {
        try {
            const { employeeId, targets, totalRevenue } = req.body;

            if (!employeeId || !Array.isArray(targets)) {
                return res.status(400).json({ error: 'Invalid payload' });
            }

            // 1️⃣ Save targets (array)
            const response = await masterService.saveTargets(employeeId, targets, totalRevenue);
            return res.status(201).json(response)

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    };

    async getAllEmployeeTargets(req, res) {
        try {
            const targets = await masterService.getAllEmployeeTargets();
            res.json(targets);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }

    // Get targets for an employee
    async getTargetsByEmployee(req, res) {
        const { employeeId } = req.params;
        console.log(employeeId);

        if (!employeeId) {
            return res.status(400).json({ error: 'employeeId required' });
        }

        try {
            const data = await masterService.getTargetsByEmployee(employeeId);
            res.json(data);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Failed to fetch employee targets' });
        }
    };

    // DELETE /deletetarget/:employeeId
    async deleteTarget(req, res) {
        const { employeeId } = req.params;

        if (!employeeId) {
            return res.status(400).json({ error: "employeeId required" });
        }

        try {
            await masterService.deleteTargets(employeeId);
            return res.json({ message: "Targets deleted successfully" });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Failed to delete targets" });
        }
    };

    async getProductRevenue(req, res) {
        try {
            const result = await masterService.getProductRevenue();
            res.status(200).json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    }


}

module.exports = new MasterController();
