const LeadService = require('../services/lead.service');

// Personal
exports.saveLeadPersonal = async (req, res) => {
    try {
        const result = await LeadService.saveLeadPersonal(req.body);
        res.status(201).json({
            message: "CRM contact created successfully",
            contact: result.contact,
            generatedPassword: result.generatedPassword
        });
    } catch (err) {
        console.error("❌ CRM leadpersonal error:", err);
        if (err.code === '23505') {
            return res.status(409).json({ error: "Duplicate Entry", details: "A contact with this mobile number already exists." });
        }
        res.status(500).json({ error: "Internal server error", details: err.message });
    }
};

exports.getLeadPersonalList = async (req, res) => {
    try {
        const result = await LeadService.getLeadPersonalList(req.query);
        res.json(result);
    } catch (err) {
        console.error("❌ CRM getLeadPersonalList error:", err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
};

exports.getLeadPersonalById = async (req, res) => {
    try {
        const result = await LeadService.getLeadPersonalById(req.params.id);
        if (!result) return res.status(404).json({ error: 'Record not found' });
        res.json(result);
    } catch (err) {
        console.error("❌ CRM getLeadPersonalById error:", err);
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
};

exports.updateLeadPersonal = async (req, res) => {
    try {
        const result = await LeadService.updateLeadPersonal(req.params.id, req.body);
        if (!result) return res.status(404).json({ error: 'Record not found' });
        res.json(result);
    } catch (err) {
        console.error("❌ CRM updateLeadPersonal error:", err);
        if (err.code === '23505') {
            return res.status(409).json({ error: "Duplicate Entry", details: "A contact with this mobile number already exists." });
        }
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
};

// Occupation
exports.saveLeadOccupation = async (req, res) => {
    if (!req.body.leadpersonal) return res.status(400).json({ error: 'leadpersonal is required' });
    try {
        const data = await LeadService.saveOccupation(req.body);
        res.status(201).json({ success: true, message: 'Lead occupation details saved successfully', data });
    } catch (err) {
        console.error('Error saving lead occupation details:', err);
        res.status(500).json({ error: 'Internal server error', message: 'Failed to save lead occupation details' });
    }
};

exports.updateLeadOccupation = async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(parseInt(id))) return res.status(400).json({ error: 'ID parameter is required and must be integer' });
    try {
        const data = await LeadService.updateOccupation(id, req.body);
        if (!data) return res.status(404).json({ error: 'Lead occupation details record not found' });
        res.json({ success: true, message: 'Lead occupation details updated successfully', data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getLeadOccupationByLeadPersonal = async (req, res) => {
    const { leadpersonal } = req.params;
    if (!leadpersonal) return res.status(400).json({ error: 'leadpersonal parameter is required' });
    try {
        const data = await LeadService.getOccupationByLeadPersonal(leadpersonal);
        res.json({ success: true, data, leadpersonal, count: data.length });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

// Bank
exports.saveLeadBank = async (req, res) => {
    if (!req.body.leadpersonal) return res.status(400).json({ error: 'leadpersonal is required' });
    try {
        const data = await LeadService.saveBank(req.body);
        res.status(201).json({ success: true, message: 'Lead bank details saved successfully', data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.updateLeadBank = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID parameter is required' });
    try {
        const data = await LeadService.updateBank(id, req.body);
        if (!data) return res.status(404).json({ error: 'Record not found' });
        res.json({ success: true, message: 'Lead bank details updated successfully', data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getLeadBankByLeadPersonal = async (req, res) => {
    const { leadpersonal } = req.params;
    if (!leadpersonal) return res.status(400).json({ error: 'leadpersonal parameter is required' });
    try {
        const data = await LeadService.getBankByLeadPersonal(leadpersonal);
        res.json({ success: true, data, leadpersonal, count: data.length });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

// Loan History
exports.saveLeadLoanHistory = async (req, res) => {
    if (!req.body.leadpersonal) return res.status(400).json({ error: 'leadpersonal is required' });
    try {
        const data = await LeadService.saveLoanHistory(req.body);
        res.status(201).json({ success: true, message: 'Lead loan history details saved successfully', data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.updateLeadLoanHistory = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'ID parameter is required' });
    try {
        const data = await LeadService.updateLoanHistory(id, req.body);
        if (!data) return res.status(404).json({ error: 'Record not found' });
        res.json({ success: true, message: 'Lead loan history details updated successfully', data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getLeadLoanHistoryByLeadPersonal = async (req, res) => {
    const { leadpersonal } = req.params;
    if (!leadpersonal) return res.status(400).json({ error: 'leadpersonal parameter is required' });
    try {
        const data = await LeadService.getLoanHistoryByLeadPersonal(leadpersonal);
        res.json({ success: true, data, leadpersonal, count: data.length });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

// Track
exports.saveLeadTrackHistory = async (req, res) => {
    if (!req.body.tracknumber || !req.body.leadid) return res.status(400).json({ error: 'tracknumber and leadid are required' });
    try {
        const data = await LeadService.saveTrackHistory(req.body);
        res.status(201).json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.saveLeadTrackDetails = async (req, res) => {
    if (!req.body.leadid) return res.status(400).json({ error: 'leadid is required' });
    try {
        const data = await LeadService.saveTrackDetails(req.body);
        res.status(201).json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.updateLeadTrackDetails = async (req, res) => {
    const { tracknumber } = req.params;
    if (!tracknumber) return res.status(400).json({ error: 'tracknumber is required' });
    try {
        const data = await LeadService.updateTrackDetails(tracknumber, req.body);
        if (!data) return res.status(404).json({ error: 'Record not found' });
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getCallHistoryTrackList = async (req, res) => {
    const { tracknumber } = req.params;
    if (!tracknumber) return res.status(400).json({ error: 'tracknumber is required' });
    try {
        const data = await LeadService.getCallHistory(tracknumber);
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getLeadTrackDetails = async (req, res) => {
    const { tracknumber } = req.params;
    if (!tracknumber) return res.status(400).json({ error: 'tracknumber is required' });
    try {
        const data = await LeadService.getTrackDetails(tracknumber);
        if (!data) return res.status(404).json({ error: 'No details found' });
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};
