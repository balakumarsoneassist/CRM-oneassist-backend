const CustomerService = require('../services/customer.service');

exports.createCustomer = async (req, res) => {
    const { loandate, product, bank, disbursedvalue, leadid } = req.body;
    // console.log(req.body);
    if (!loandate || !product || !bank || !disbursedvalue || !leadid) {
        return res.status(400).json({ error: 'Required fields missing', required: ['loandate', 'product', 'bank', 'disbursedvalue', 'leadid'] });
    }
    try {
        const data = await CustomerService.createCustomer(req.body);
        res.status(201).json({ success: true, message: 'Customer record created successfully and lead track updated', data });
    } catch (err) {
        if (err.message === 'Lead not found') return res.status(404).json({ error: 'Lead not found', message: 'No lead found with the provided leadid' });
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getTodayAppointment = async (req, res) => {
    const { empid } = req.params;
    if (!empid || isNaN(parseInt(empid))) return res.status(400).json({ error: 'Valid employee ID is required' });
    try {
        const data = await CustomerService.getTodayAppointment(parseInt(empid));
        res.json({ success: true, count: data.length, data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getCustomerList = async (req, res) => {
    try {
        const data = await CustomerService.getCustomerList();
        res.json({ success: true, count: data.length, data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};
