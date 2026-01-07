const ReportService = require('../services/report.service');

exports.getOverallStatus = async (req, res) => {
    const { orgid } = req.params;
    if (!orgid || isNaN(parseInt(orgid))) return res.status(400).json({ error: 'orgid must be a valid integer' });
    try {
        const data = await ReportService.getOverallStatus(parseInt(orgid));
        res.json({ success: true, data, orgid: parseInt(orgid) });
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
    const { assignee, startdate, enddate } = req.query;
    if (!assignee || !startdate || !enddate) return res.status(400).json({ error: 'Missing parameters' });
    try {
        const data = await ReportService.getUserReport(assignee, startdate, enddate);
        res.json({ success: true, data, parameters: { assignee, startdate, enddate } });
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
