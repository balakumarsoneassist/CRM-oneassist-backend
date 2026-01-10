const customerService = require("../services/customer.service");

class CustomerController {

    // =========================
    // Contacts
    // =========================
    async getUnassignedContacts(req, res) {
        try {
            const data = await customerService.getUnassignedContacts(req.params.orgid);
            res.json(data);
        } catch (err) {
            console.error("Error in getUnassignedContacts:", err);
            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }

    async getAssignedContacts(req, res) {
        try {
            const data = await customerService.getAssignedContacts(
                req.params.userid,
                req.params.orgid
            );
            res.json(data);
        } catch (err) {
            console.error("Error in getAssignedContacts:", err);
            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }

    async getTrackContacts(req, res) {
        try {
            const data = await customerService.getTrackContacts(
                req.params.userid,
                req.params.orgid
            );
            res.json(data);
        } catch (err) {
            console.error("Error in getTrackContacts:", err);
            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }

    async getTrackCustomers(req, res) {
        try {
            const { userId, orgId } = req.params;
            const customers = await customerService.getTrackCustomers(userId, orgId);
            res.status(200).json(customers);
        } catch (error) {
            console.error("Error fetching track customers:", error);
            res.status(500).json({ error: "Failed to fetch track customers" });
        }
    }

    async startTracking(req, res) {
        try {
            const { customerId, userId, orgId } = req.body;
            await customerService.startTracking(customerId, userId, orgId);
            res.status(200).json({ success: true, message: "Tracking started" });
        } catch (error) {
            console.error("Error starting tracking:", error);
            res.status(500).json({ error: "Failed to start tracking" });
        }
    }

    // =========================
    // Leads
    // =========================
    async getTrackLeads(req, res) {
        try {
            const data = await customerService.getTrackLeads(
                req.params.userid,
                req.params.orgid
            );
            res.json(data);
        } catch (err) {
            console.error("Error in getTrackLeads:", err);
            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }

    async getUnassignedLeads(req, res) {
        try {
            const data = await customerService.getUnassignedLeads(req.params.orgid);
            res.json(data);
        } catch (err) {
            console.error("Error in getUnassignedLeads:", err);
            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }

    async getAssignedLeads(req, res) {
        try {
            const data = await customerService.getAssignedLeads(
                req.params.userid,
                req.params.orgid
            );
            res.json(data);
        } catch (err) {
            console.error("Error in getAssignedLeads:", err);
            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }

    // =========================
    // Customer
    // =========================
    async createCustomer(req, res) {
        try {
            const { loandate, product, bank, disbursedvalue, leadid } = req.body;

            if (!loandate || !product || !bank || !disbursedvalue || !leadid) {
                return res.status(400).json({
                    error: "Required fields missing",
                    required: ["loandate", "product", "bank", "disbursedvalue", "leadid"]
                });
            }

            const data = await customerService.createCustomer(req.body);

            res.status(201).json({
                success: true,
                message: "Customer record created successfully and lead track updated",
                data
            });
        } catch (err) {
            if (err.message === "Lead not found") {
                return res.status(404).json({
                    error: "Lead not found",
                    message: "No lead found with the provided leadid"
                });
            }

            console.error("Error in createCustomer:", err);
            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }

    async getCustomerList(req, res) {
        try {
            const followedBy = (req.user && (req.user.isadminrights === false || req.user.isadminrights === 'false'))
                ? req.user.id
                : null;

            const data = await customerService.getCustomerList(followedBy);
            res.json({
                success: true,
                count: data.length,
                data
            });
        } catch (err) {
            console.error("Error in getCustomerList:", err);
            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }

    async getAllCustomers(req, res) {
        try {
            const parseArray = (val) => {
                if (!val) return [];
                if (Array.isArray(val)) return val;
                return val.toString().split(',').filter(x => x).map(x => x.trim());
            };

            const filters = {
                search: req.query.search || '',
                segments: parseArray(req.query.segments),
                categories: parseArray(req.query.categories),
                banks: parseArray(req.query.banks),
                loanTypes: parseArray(req.query.loanTypes),
                minAmount: req.query.minAmount ? parseFloat(req.query.minAmount) : null,
                maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount) : null,
                page: parseInt(req.query.page) || 1,
                limit: parseInt(req.query.limit) || 10
            };

            // If not admin, restrict by employee ID
            if (req.user && (req.user.isadminrights === false || req.user.isadminrights === 'false')) {
                filters.followedBy = req.user.id;
            }

            const result = await customerService.getAllCustomers(filters);
            res.json({
                success: true,
                ...result
            });
        } catch (err) {
            console.error("Error in getAllCustomers:", err);
            res.status(500).json({ error: "Internal server error", details: err.message });
        }
    }

    // =========================
    // Appointments
    // =========================
    async getTodayAppointment(req, res) {
        try {
            const { empid } = req.params;

            if (!empid || isNaN(parseInt(empid))) {
                return res.status(400).json({
                    error: "Valid employee ID is required"
                });
            }

            const data = await customerService.getTodayAppointment(parseInt(empid));

            res.json({
                success: true,
                count: data.length,
                data
            });
        } catch (err) {
            console.error("Error in getTodayAppointment:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    // =========================
    // Loans
    // =========================
    async getLoanList(req, res) {
        try {
            const data = await customerService.getLoanList();
            res.json({
                success: true,
                count: data.length,
                data
            });
        } catch (err) {
            console.error("Error in getLoanList:", err);
            res.status(err.status || 500).json({
                error: err.message || "Internal server error"
            });
        }
    }

    async reassignCustomer(req, res) {
        try {
            const id = req.params.id || req.body.customerId;
            if (!id) return res.status(400).json({ error: "Customer ID is required" });

            const result = await customerService.reassignToContact(id);
            if (!result) return res.status(404).json({ error: "Customer not found or no lead linked" });

            res.json({
                success: true,
                message: "Customer reassigned to unassigned contacts successfully",
                data: result
            });
        } catch (err) {
            console.error("Error in reassignCustomer:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }

    async bulkAssignUnassigned(req, res) {
        try {
            const { empid } = req.body;
            const orgid = req.body.orgid || (req.user ? req.user.organizationid : null);

            if (!empid) {
                return res.status(400).json({ error: "Employee ID (empid) is required" });
            }
            if (!orgid) {
                return res.status(400).json({ error: "Organization ID (orgid) is required" });
            }

            const result = await customerService.bulkAssignUnassigned(empid, orgid);
            res.json({
                success: true,
                message: `Successfully assigned ${result.count} contacts to employee`,
                count: result.count
            });
        } catch (err) {
            console.error("Error in bulkAssignUnassigned:", err);
            res.status(500).json({ error: "Internal server error", details: err.message });
        }
    }

    async reassignToEmployee(req, res) {
        try {
            const { empid, customerId, reason } = req.body;
            const orgid = req.body.orgid || (req.user ? req.user.organizationid : null);

            if (!empid || !customerId) {
                return res.status(400).json({ error: "Employee ID and Customer ID are required" });
            }

            await customerService.reassignToEmployee(customerId, empid, orgid, reason);
            res.json({
                success: true,
                message: "Customer reassigned successfully"
            });
        } catch (err) {
            console.error("Error in reassignToEmployee:", err);
            res.status(500).json({ error: "Internal server error", details: err.message });
        }
    }

    async getTimeline(req, res) {
        try {
            const { id } = req.params;
            const data = await customerService.getTimeline(id);
            res.json({ success: true, data });
        } catch (err) {
            console.error("Error in getTimeline:", err);
            res.status(500).json({ error: "Internal server error" });
        }
    }
}

module.exports = new CustomerController();
