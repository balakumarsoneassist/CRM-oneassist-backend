const ReportService = require('../services/report.service');

exports.getOverallStatus = async (req, res) => {
    try {
        const { orgid } = req.params;
        let { empid } = req.query;

        console.log(`[getOverallStatus] Query Params:`, req.query);
        console.log(`[getOverallStatus] User in Request:`, req.user ? JSON.stringify(req.user) : 'undefined');

        // Enforce: Non-admins can only see their own summary
        if (!req.user?.isadminrights) {
            empid = req.user?.id;
        }

        console.log(`[getOverallStatus] Final EmpId Used: ${empid}`);

        const data = await ReportService.getOverallStatus(orgid, empid);
        res.status(200).json({
            success: true,
            data: data,
            orgid: orgid
        });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getLeadFollowAllStatusReport = async (req, res) => {
    const { orgid, statuscode } = req.query;
    if (!orgid || !statuscode) return res.status(400).json({ error: 'Missing parameters' });
    try {
        const data = await ReportService.getLeadFollowAllStatusReport(parseInt(orgid), parseInt(statuscode));
        res.json({ success: true, data, parameters: { orgid: parseInt(orgid), statuscode: parseInt(statuscode) } });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getContactFollowAllStatusReport = async (req, res) => {
    const { orgid, statuscode } = req.query;
    if (!orgid || !statuscode) return res.status(400).json({ error: 'Missing parameters' });
    try {
        const data = await ReportService.getContactFollowAllStatusReport(parseInt(orgid), parseInt(statuscode));
        res.json({ success: true, data, parameters: { orgid: parseInt(orgid), statuscode: parseInt(statuscode) } });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getLCFollowEmpStatusReport = async (req, res) => {
    const { orgid, statuscode, empid } = req.query;
    if (!orgid || !statuscode || !empid) return res.status(400).json({ error: 'Missing parameters' });
    try {
        const result = await ReportService.getLCFollowEmpStatusReport(parseInt(orgid), parseInt(statuscode), parseInt(empid));
        res.json({ success: true, data: result.rows, functionUsed: result.functionUsed, parameters: { orgid, statuscode, empid } });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getUserReport = async (req, res) => {
    try {
        const query = req.query;

        // Enforce: Non-admins can only see their own daily report
        if (!req.user?.isadminrights) {
            query.assignee = req.user.id;
        }

        const data = await ReportService.getUserReport(query);
        res.status(200).json({
            success: true, count: data.length, data
        });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getDashboardUser = async (req, res) => {
    const { empid } = req.params;
    if (!empid) return res.status(400).json({ error: 'Valid employee ID is required' });
    try {
        const data = await ReportService.getDashboardUser(parseInt(empid));
        res.json({ success: true, count: data.length, data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getDashboardAdmin = async (req, res) => {
    try {
        const data = await ReportService.getDashboardAdmin();
        res.json({ success: true, count: data.length, data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};
