const ContactService = require('../services/contact.service');

exports.getUnassignedContacts = async (req, res) => {
    const { orgid } = req.params;
    if (!orgid) return res.status(400).json({ error: 'OrgId is required' });
    try {
        const data = await ContactService.getUnassignedContacts(orgid);
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getAssignedContacts = async (req, res) => {
    const { userid, orgid } = req.params;
    if (!userid || !orgid) return res.status(400).json({ error: 'userid and orgid are required' });
    try {
        const data = await ContactService.getAssignedContacts(userid, orgid);
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getTrackContacts = async (req, res) => {
    const { userid, orgid } = req.params;
    if (!userid || !orgid) return res.status(400).json({ error: 'userid and orgid are required' });
    try {
        const data = await ContactService.getTrackContacts(userid, orgid);
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getTrackLeads = async (req, res) => {
    const { userid, orgid } = req.params;
    if (!userid || !orgid) return res.status(400).json({ error: 'userid and orgid are required' });
    try {
        const data = await ContactService.getTrackLeads(userid, orgid);
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getUnassignedLeads = async (req, res) => {
    const { orgid } = req.params;
    if (!orgid) return res.status(400).json({ error: 'OrgId is required' });
    try {
        const data = await ContactService.getUnassignedLeads(orgid);
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getAssignedLeads = async (req, res) => {
    const { userid, orgid } = req.params;
    if (!userid || !orgid) return res.status(400).json({ error: 'userid and orgid are required' });
    try {
        const data = await ContactService.getAssignedLeads(userid, orgid);
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};
