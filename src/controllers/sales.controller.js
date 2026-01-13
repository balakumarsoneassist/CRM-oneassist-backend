const SalesService = require('../services/sales.service');

// =========================
// Save Sales Visit
// =========================
exports.saveSalesVisit = async (req, res) => {
    const { name, mobileno, createdby } = req.body;

    if (!name || !mobileno || !createdby) {
        return res.status(400).json({
            error: 'name, mobileno, and createdby are required'
        });
    }

    try {
        const result = await SalesService.saveSalesVisit(req.body);
        res.status(201).json({
            message: 'Sales visit saved successfully',
            customer: result.customer,
            track: result.track
        });
    } catch (err) {
        if (err.partial) {
            console.error('Partial Error:', err.error);
            return res.status(500).json({
                error: 'Customer saved but failed to save visit track',
                details: err.error?.message || err.message,
                stack: err.error?.stack || err.stack,
                customer: err.customer
            });
        }
        console.error('Full Error:', err);
        res.status(500).json({
            error: 'Internal server error',
            details: err.message,
            stack: err.stack
        });
    }
};

// =========================
// Save Sales Visit Track
// =========================
exports.saveSalesVisitTrack = async (req, res) => {
    if (!req.body.custid) {
        return res.status(400).json({ error: 'custid is required' });
    }

    try {
        const data = await SalesService.saveSalesVisitTrack(req.body);
        res.status(201).json({
            message: 'Sales visit track saved successfully',
            data
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// =========================
// Get Sales Visit Track List (NEW)
// =========================
exports.getSVTrackList = async (req, res) => {
    const { custid } = req.params;

    if (!custid) {
        return res.status(400).json({ error: 'custid required' });
    }

    try {
        const data = await SalesService.getSVTrackList(custid);
        res.json({
            success: true,
            data,
            custid,
            count: data.length
        });
    } catch (err) {
        console.error("Error in getSVTrackList:", err);
        res.status(err.status || 500).json({
            error: err.message || "Internal server error"
        });
    }
};

// =========================
// Get Sales Visit Customer List by Emp
// =========================
exports.getSVCustomerList = async (req, res) => {
    const { empid } = req.params;
    console.log('[DEBUG] getSVCustomerList called for empid:', empid);

    if (!empid) {
        return res.status(400).json({ error: 'empid required' });
    }

    try {
        const data = await SalesService.getSVCustomerList(empid);
        console.log(`[DEBUG] Found ${data.length} customers for empid: ${empid}`);
        res.json({ success: true, data, empid });
    } catch (err) {
        console.error('[DEBUG] Error in getSVCustomerList:', err);
        res.status(500).json({
            error: 'Internal server error',
            details: err.message
        });
    }
};

// =========================
// Get Sales Visit Customers by Cust ID
// =========================
exports.getSVCustListByCustId = async (req, res) => {
    const { custid } = req.params;

    if (!custid) {
        return res.status(400).json({ error: 'custid required' });
    }

    try {
        const data = await SalesService.getSVCustListByCustId(custid);
        res.json({
            success: true,
            data,
            custid,
            count: data.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// =========================
// Update Sales Visit Customer
// =========================
exports.updateSVCustomer = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'id required' });
    }

    try {
        const data = await SalesService.updateSVCustomer(id);
        if (!data) {
            return res.status(404).json({
                error: 'Sales visit customer not found'
            });
        }

        res.json({
            success: true,
            message: 'Customer contact flag updated successfully',
            data
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// =========================
// Get All Sales Visit Customers
// =========================
exports.getSVAllCustomers = async (req, res) => {
    try {
        const data = await SalesService.getSVAllCustomers();
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// =========================
// Get Sales Visit Customers by Employee
// =========================
exports.getSVCustomersByEmp = async (req, res) => {
    let { empid } = req.params;

    // Check if user is admin (this logic depends on how you pass user info, here generic check)
    // If you want to use req.user from middleware:
    /*
    if (req.user && (req.user.isadminrights === true || req.user.isadminrights === 'true')) {
        empid = 'admin';
    }
    */
    // For now, let's assume the frontend passes 'admin' if the user is an admin
    // OR we can check it here if we have middleware.
    // Based on requirements: "Admins should see and manage all employees' follow-ups"

    if (!empid) {
        return res.status(400).json({ error: 'empid required' });
    }

    try {
        const data = await SalesService.getSVCustomersByEmp(empid);
        res.json({
            success: true,
            data,
            empid,
            count: data.length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// =========================
// Approve Follow Up
// =========================
exports.approveFollowUp = async (req, res) => {
    const { tracknumber } = req.body;

    if (!tracknumber) {
        return res.status(400).json({ error: 'tracknumber required' });
    }

    try {
        // Use TrackModel directly or via SalesService if preferred
        // Importing TrackModel here for direct access as it's a specific track action
        const TrackModel = require('../models/track.model');
        const result = await TrackModel.updateApprovalStatus(tracknumber, 'Approved');

        res.json({
            success: true,
            message: 'Follow-up approved successfully',
            data: result
        });
    } catch (err) {
        console.error("Error in approveFollowUp:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// =========================
// Reject Follow Up
// =========================
exports.rejectFollowUp = async (req, res) => {
    const { tracknumber } = req.body;

    if (!tracknumber) {
        return res.status(400).json({ error: 'tracknumber required' });
    }

    try {
        const TrackModel = require('../models/track.model');
        const result = await TrackModel.updateApprovalStatus(tracknumber, 'Rejected');

        res.json({
            success: true,
            message: 'Follow-up rejected successfully',
            data: result
        });
    } catch (err) {
        console.error("Error in rejectFollowUp:", err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
