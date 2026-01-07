const QRCodeModel = require('../models/qrcode.model');

class QRCodeService {
    async saveQRCodeCustomer(data) {
        const { name, contactperson, presentaddress, city, pincode, emailid, mobilenumber, referer, modifiedby, qrtoken } = data;
        const customer = await QRCodeModel.insertCustomer([name, contactperson, presentaddress, city, pincode, emailid, mobilenumber, referer, modifiedby]);
        if (!customer) throw new Error('Failed to insert customer record');

        const token = await QRCodeModel.insertToken([customer.id, qrtoken, modifiedby]);
        if (!token) throw new Error('Failed to insert QR token record');

        return { customer: { id: customer.id, name, contactperson, emailid, mobilenumber }, token };
    }

    async saveQRResponse(data) {
        const { firstname, location, mobile, productname, qrtoken } = data;
        const qrresponse = await QRCodeModel.insertResponse([firstname, location, mobile, productname, qrtoken]);

        const leadpersonaldetails = await QRCodeModel.insertLeadFromQR([firstname, mobile, 5001, location, productname, 1001, 'QR Code Contact', 1, ' ']);

        return { qrresponse, leadpersonaldetails };
    }

    async getQRResponseList() {
        return await QRCodeModel.selectResponseList();
    }
}

module.exports = new QRCodeService();
