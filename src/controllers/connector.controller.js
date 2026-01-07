const ConnectorService = require('../services/connector.service');

exports.createConnector = async (req, res) => {
    const { name, mobilenumber, emailid, isactive } = req.body;
    if (!name || !mobilenumber || !emailid || typeof isactive === 'undefined') return res.status(400).json({ error: 'name, mobilenumber, emailid, and isactive are required' });
    try {
        const result = await ConnectorService.createConnector(req.body);
        res.status(201).json({ message: 'Connector created successfully', id: result.id });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error', message: err.message }); }
};

exports.updateConnector = async (req, res) => {
    const { id } = req.params;
    const { name, mobilenumber, isactive } = req.body;
    if (!id) return res.status(400).json({ error: 'Connector ID is required' });
    if (!name || !mobilenumber || typeof isactive === 'undefined') return res.status(400).json({ error: 'name, mobilenumber, and isactive are required' });

    try {
        const connector = await ConnectorService.updateConnector(id, req.body);
        if (!connector) return res.status(404).json({ error: 'Connector not found' });
        res.json({ message: 'Connector updated successfully', connector });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getConnectorById = async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Connector ID is required' });
    try {
        const data = await ConnectorService.getConnectorById(id);
        if (!data) return res.status(404).json({ error: 'Connector not found' });
        res.json({ success: true, data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getConnectorList = async (req, res) => {
    try {
        const data = await ConnectorService.getConnectorList();
        res.json({ success: true, count: data.length, data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.connectorLogin = async (req, res) => {
    const { mobilenumber, password } = req.body;
    if (!mobilenumber || !password) return res.status(400).json({ error: 'Validation error', message: 'Mobile number and password are required' });
    try {
        const connector = await ConnectorService.login(mobilenumber, password);
        res.json({ success: true, message: 'Login successful', data: { id: connector.id, name: connector.name, mobilenumber: connector.mobilenumber, emailid: connector.emailid, location: connector.location, isactive: connector.isactive } });
    } catch (err) {
        if (err.message === 'Invalid mobile number or password') return res.status(401).json({ error: 'Authentication failed', message: 'Invalid mobile number or password' });
        console.error(err); res.status(500).json({ error: 'Internal server error' });
    }
};

exports.createConnectorContact = async (req, res) => {
    const { firstname, mobilenumber, connectorid } = req.body;
    if (!firstname || !mobilenumber || !connectorid) return res.status(400).json({ error: 'Validation error', message: 'firstname, mobilenumber, and connectorid are required fields' });
    try {
        const data = await ConnectorService.createConnectorContact(req.body);
        if (!data) return res.status(500).json({ error: 'Failed' });
        res.status(201).json({ success: true, message: 'Connector contact created successfully', data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};
