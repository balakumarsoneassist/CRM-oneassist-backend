const QRCodeService = require('../services/qrcode.service');

exports.saveQRCodeCustomers = async (req, res) => {
    const { name, qrtoken } = req.body;
    if (!name || !qrtoken) return res.status(400).json({ error: 'name and qrtoken are required' });
    try {
        const data = await QRCodeService.saveQRCodeCustomer(req.body);
        res.status(201).json({ success: true, message: 'QR Code customer and token saved successfully', data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.saveQRResponse = async (req, res) => {
    const { firstname, location, mobile, productname, qrtoken } = req.body;
    if (!firstname || !location || !mobile || !productname || !qrtoken) return res.status(400).json({ error: 'required fields missing' });
    try {
        const data = await QRCodeService.saveQRResponse(req.body);
        res.json({ success: true, message: 'QR response and lead personal details saved successfully', qrresponse: data.qrresponse, leadpersonaldetails: data.leadpersonaldetails });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};

exports.getQRResponseList = async (req, res) => {
    try {
        const data = await QRCodeService.getQRResponseList();
        res.json({ success: true, count: data.length, data });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Internal server error' }); }
};
