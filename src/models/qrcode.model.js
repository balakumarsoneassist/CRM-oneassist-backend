const pool = require('../db/index');

class QRCodeModel {
    async insertCustomer(params) {
        const { rows } = await pool.query(`INSERT INTO qrcodecustomers (name, contactperson, presentaddress, city, pincode, emailid, mobilenumber, createtime, referer, modifiedby) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9) RETURNING id`, params);
        return rows[0];
    }

    async insertToken(params) {
        const { rows } = await pool.query(`INSERT INTO qrcodetoken (customerid, qrtoken, createtime, modifiedby,validfrom,validto) VALUES ($1, $2, NOW(), $3, NOW(), NOW()) RETURNING *`, params);
        return rows[0];
    }

    async insertResponse(params) {
        const { rows } = await pool.query(`INSERT INTO qrresponse (firstname, location, mobile, productname, qrtoken, createdon) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`, params);
        return rows[0];
    }

    async insertLeadFromQR(params) {
        const { rows } = await pool.query(`INSERT INTO leadpersonaldetails (firstname, mobilenumber, locationid, presentaddress, productname, organizationid, createdon, contacttype, status,lastname) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8,$9) RETURNING *`, params);
        return rows[0];
    }

    async selectResponseList() {
        const { rows } = await pool.query('select * from getqresponse()');
        return rows;
    }
}

module.exports = new QRCodeModel();
