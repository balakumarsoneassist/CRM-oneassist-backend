const MasterService = require('../services/master.service');

// Branch
exports.createBranch = async (req, res) => {
    const { location, name, isactive } = req.body;
    if (!location || !name || typeof isactive === 'undefined') return res.status(400).json({ error: 'location, name and isactive required' });
    try {
        const data = await MasterService.createBranch(req.body);
        res.status(201).json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.updateBranch = async (req, res) => {
    const { id } = req.params;
    const { location, name, isactive } = req.body;
    if (typeof location === 'undefined' && typeof name === 'undefined' && typeof isactive === 'undefined') return res.status(400).json({ error: 'Nothing to update' });
    try {
        const data = await MasterService.updateBranch(id, req.body);
        if (!data) return res.status(404).json({ error: 'Branch not found' });
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getBranches = async (req, res) => {
    try {
        const data = await MasterService.getBranches(req.query);
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

// Location
exports.createLocation = async (req, res) => {
    const { location, state } = req.body;
    if (!location || !state) return res.status(400).json({ error: 'location and state required' });
    try {
        const data = await MasterService.createLocation(req.body);
        res.status(201).json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.updateLocation = async (req, res) => {
    const { id } = req.params;
    const { location, state } = req.body;
    if (typeof location === 'undefined' && typeof state === 'undefined') return res.status(400).json({ error: 'Nothing to update' });
    try {
        const data = await MasterService.updateLocation(id, req.body);
        if (!data) return res.status(404).json({ error: 'location not found' });
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getLocations = async (req, res) => {
    try {
        const data = await MasterService.getLocations(req.query);
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

// Bank
exports.createBank = async (req, res) => {
    const { bankname } = req.body;
    if (!bankname) return res.status(400).json({ error: 'bankname is required' });
    try {
        const data = await MasterService.createBank(req.body);
        res.status(201).json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.updateBank = async (req, res) => {
    const { id } = req.params;
    const { bankname } = req.body;
    if (!id || !bankname) return res.status(400).json({ error: 'id and bankname required' });
    try {
        const data = await MasterService.updateBank(id, req.body);
        if (!data) return res.status(404).json({ error: 'Record not found' });
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getBanks = async (req, res) => {
    try {
        const data = await MasterService.getBanks();
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getBankById = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'id is required' });
    try {
        const data = await MasterService.getBankById(id);
        if (!data) return res.status(404).json({ error: 'Record not found' });
        res.json(data);
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getLoanList = async (req, res) => {
    try {
        const data = await MasterService.getLoanList();
        res.json({ success: true, count: data.length, data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};
