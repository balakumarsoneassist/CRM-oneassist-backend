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
}

module.exports = new MasterController();
