const leadService = require("../services/lead.service");

class LeadController {

    // =========================
    // Lead Personal
    // =========================
    async createLeadPersonal(req, res) {
        try {
            const result = await leadService.saveLeadPersonal(req.body);
            res.status(201).json({
                message: "CRM contact created successfully",
                contact: result.contact,
                generatedPassword: result.generatedPassword
            });
        } catch (err) {
            console.error("❌ createLeadPersonal:", err);
            if (err.code === "23505") {
                return res.status(409).json({
                    error: "Duplicate Entry",
                    details: "A contact with this mobile number already exists."
                });
            }
            res.status(500).json({ error: "Internal server error", details: err.message });
        }
    }

    async getLeadPersonal(req, res) {
        try {
            const data = await leadService.getLeadPersonalList(req.query);
            res.json(data);
        } catch (err) {
            console.error("❌ getLeadPersonal:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getLeadPersonalById(req, res) {
        try {
            const data = await leadService.getLeadPersonalById(req.params.id);
            if (!data) return res.status(404).json({ error: "Record not found" });
            res.json(data);
        } catch (err) {
            console.error("❌ getLeadPersonalById:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateLeadPersonal(req, res) {
        try {
            const data = await leadService.updateLeadPersonal(req.params.id, req.body);
            if (!data) return res.status(404).json({ error: "Record not found" });
            res.json(data);
        } catch (err) {
            console.error("❌ updateLeadPersonal:", err);
            if (err.code === "23505") {
                return res.status(409).json({
                    error: "Duplicate Entry",
                    details: "A contact with this mobile number already exists."
                });
            }
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Lead Occupation
    // =========================
    async createLeadOccupation(req, res) {
        if (!req.body.leadpersonal) {
            return res.status(400).json({ error: "leadpersonal is required" });
        }
        try {
            const data = await leadService.saveOccupation(req.body);
            res.status(201).json({
                success: true,
                message: "Lead occupation details saved successfully",
                data
            });
        } catch (err) {
            console.error("❌ createLeadOccupation:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateLeadOccupation(req, res) {
        const { id } = req.params;
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ error: "Valid ID is required" });
        }
        try {
            const data = await leadService.updateOccupation(id, req.body);
            if (!data) return res.status(404).json({ error: "Record not found" });
            res.json({
                success: true,
                message: "Lead occupation details updated successfully",
                data
            });
        } catch (err) {
            console.error("❌ updateLeadOccupation:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getLeadOccupationByLeadPersonal(req, res) {
        const { leadpersonal } = req.params;
        if (!leadpersonal) {
            return res.status(400).json({ error: "leadpersonal is required" });
        }
        try {
            const data = await leadService.getOccupationByLeadPersonal(leadpersonal);
            res.json({ success: true, data, count: data.length });
        } catch (err) {
            console.error("❌ getLeadOccupation:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Lead Bank
    // =========================
    async createLeadBank(req, res) {
        if (!req.body.leadpersonal) {
            return res.status(400).json({ error: "leadpersonal is required" });
        }
        try {
            const data = await leadService.saveBank(req.body);
            res.status(201).json({
                success: true,
                message: "Lead bank details saved successfully",
                data
            });
        } catch (err) {
            console.error("❌ createLeadBank:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateLeadBank(req, res) {
        if (!req.params.id) {
            return res.status(400).json({ error: "ID is required" });
        }
        try {
            const data = await leadService.updateBank(req.params.id, req.body);
            if (!data) return res.status(404).json({ error: "Record not found" });
            res.json({
                success: true,
                message: "Lead bank details updated successfully",
                data
            });
        } catch (err) {
            console.error("❌ updateLeadBank:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getLeadBankByLeadPersonal(req, res) {
        const { leadpersonal } = req.params;
        if (!leadpersonal) {
            return res.status(400).json({ error: "leadpersonal is required" });
        }
        try {
            const data = await leadService.getBankByLeadPersonal(leadpersonal);
            res.json({ success: true, data, count: data.length });
        } catch (err) {
            console.error("❌ getLeadBank:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Lead Loan History
    // =========================
    async createLeadLoanHistory(req, res) {
        if (!req.body.leadpersonal) {
            return res.status(400).json({ error: "leadpersonal is required" });
        }
        try {
            const data = await leadService.saveLoanHistory(req.body);
            res.status(201).json({
                success: true,
                message: "Lead loan history details saved successfully",
                data
            });
        } catch (err) {
            console.error("❌ createLeadLoanHistory:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateLeadLoanHistory(req, res) {
        if (!req.params.id) {
            return res.status(400).json({ error: "ID is required" });
        }
        try {
            const data = await leadService.updateLoanHistory(req.params.id, req.body);
            if (!data) return res.status(404).json({ error: "Record not found" });
            res.json({
                success: true,
                message: "Lead loan history updated successfully",
                data
            });
        } catch (err) {
            console.error("❌ updateLeadLoanHistory:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getLeadLoanHistoryByLeadPersonal(req, res) {
        const { leadpersonal } = req.params;
        if (!leadpersonal) {
            return res.status(400).json({ error: "leadpersonal is required" });
        }
        try {
            const data = await leadService.getLoanHistoryByLeadPersonal(leadpersonal);
            res.json({ success: true, data, count: data.length });
        } catch (err) {
            console.error("❌ getLeadLoanHistory:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Lead Track
    // =========================
    async saveLeadTrackHistory(req, res) {
        if (!req.body.tracknumber || !req.body.leadid) {
            return res.status(400).json({ error: "tracknumber and leadid are required" });
        }
        try {
            const data = await leadService.saveTrackHistory(req.body);
            res.status(201).json(data);
        } catch (err) {
            console.error("❌ saveLeadTrackHistory:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async saveLeadTrackDetails(req, res) {
        if (!req.body.leadid) {
            return res.status(400).json({ error: "leadid is required" });
        }
        try {
            const data = await leadService.saveTrackDetails(req.body);
            res.status(201).json(data);
        } catch (err) {
            console.error("❌ saveLeadTrackDetails:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async updateLeadTrackDetails(req, res) {
        const { tracknumber } = req.params;
        if (!tracknumber) {
            return res.status(400).json({ error: "tracknumber is required" });
        }
        try {
            const data = await leadService.updateTrackDetails(tracknumber, req.body);
            if (!data) return res.status(404).json({ error: "Record not found" });
            res.json(data);
        } catch (err) {
            console.error("❌ updateLeadTrackDetails:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getCallHistoryTrackList(req, res) {
        const { tracknumber } = req.params;
        if (!tracknumber) {
            return res.status(400).json({ error: "tracknumber is required" });
        }
        try {
            const data = await leadService.getCallHistory(tracknumber);
            res.json(data);
        } catch (err) {
            console.error("❌ getCallHistory:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async getLeadTrackDetails(req, res) {
        const { tracknumber } = req.params;
        if (!tracknumber) {
            return res.status(400).json({ error: "tracknumber is required" });
        }
        try {
            const data = await leadService.getTrackDetails(tracknumber);
            if (!data) return res.status(404).json({ error: "No details found" });
            res.json(data);
        } catch (err) {
            console.error("❌ getLeadTrackDetails:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = new LeadController();
