const ConnectorService = require("../services/connector.service");

class ConnectorController {

    // =========================
    // Create Connector
    // =========================
    async createConnector(req, res) {
        try {
            const { name, mobilenumber, emailid, isactive } = req.body;

            if (!name || !mobilenumber || !emailid || typeof isactive === "undefined") {
                return res.status(400).json({
                    error: "name, mobilenumber, emailid, and isactive are required"
                });
            }

            const result = await ConnectorService.createConnector(req.body);

            res.status(201).json({
                message: "Connector created successfully",
                id: result.id
            });
        } catch (err) {
            console.error("Error in createConnector:", err);
            res.status(500).json({
                error: "Internal server error",
                message: err.message
            });
        }
    }

    // =========================
    // Update Connector
    // =========================
    async updateConnector(req, res) {
        try {
            const { id } = req.params;
            const { name, mobilenumber, isactive } = req.body;

            if (!id) {
                return res.status(400).json({ error: "Connector ID is required" });
            }

            if (!name || !mobilenumber || typeof isactive === "undefined") {
                return res.status(400).json({
                    error: "name, mobilenumber, and isactive are required"
                });
            }

            const connector = await ConnectorService.updateConnector(id, req.body);

            if (!connector) {
                return res.status(404).json({ error: "Connector not found" });
            }

            res.json({
                message: "Connector updated successfully",
                connector
            });
        } catch (err) {
            console.error("Error in updateConnector:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Get Connector By ID
    // =========================
    async getConnectorById(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: "Connector ID is required" });
            }

            const data = await ConnectorService.getConnectorById(id);

            if (!data) {
                return res.status(404).json({ error: "Connector not found" });
            }

            res.json({ success: true, data });
        } catch (err) {
            console.error("Error in getConnectorById:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Get Connector List
    // =========================
    async getConnectorList(req, res) {
        try {
            const data = await ConnectorService.getConnectorList();

            res.json({
                success: true,
                count: data.length,
                data
            });
        } catch (err) {
            console.error("Error in getConnectorList:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Connector Login
    // =========================
    async connectorLogin(req, res) {
        try {
            const { mobilenumber, password } = req.body;

            if (!mobilenumber || !password) {
                return res.status(400).json({
                    error: "Validation error",
                    message: "Mobile number and password are required"
                });
            }

            const connector = await ConnectorService.login(mobilenumber, password);

            res.json({
                success: true,
                message: "Login successful",
                data: {
                    id: connector.id,
                    name: connector.name,
                    mobilenumber: connector.mobilenumber,
                    emailid: connector.emailid,
                    location: connector.location,
                    isactive: connector.isactive
                }
            });
        } catch (err) {
            if (err.message === "Invalid mobile number or password") {
                return res.status(401).json({
                    error: "Authentication failed",
                    message: "Invalid mobile number or password"
                });
            }

            console.error("Error in connectorLogin:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Create Connector Contact
    // =========================
    async createConnectorContact(req, res) {
        try {
            const { firstname, mobilenumber, connectorid } = req.body;

            if (!firstname || !mobilenumber || !connectorid) {
                return res.status(400).json({
                    error: "Validation error",
                    message: "firstname, mobilenumber, and connectorid are required fields"
                });
            }

            const data = await ConnectorService.createConnectorContact(req.body);

            if (!data) {
                return res.status(500).json({ error: "Failed" });
            }

            res.status(201).json({
                success: true,
                message: "Connector contact created successfully",
                data
            });
        } catch (err) {
            console.error("Error in createConnectorContact:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = new ConnectorController();
