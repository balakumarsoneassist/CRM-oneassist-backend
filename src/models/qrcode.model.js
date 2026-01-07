const pool = require("../db/index"); // single pool source

class QRModel {

    /* =========================
     * QR CODE CUSTOMER
     * ========================= */

    // New style (object-based)
    async createCustomer(data) {
        const {
            name,
            contactperson,
            presentaddress,
            city,
            pincode,
            emailid,
            mobilenumber,
            referer,
            modifiedby
        } = data;

        const { rows } = await pool.query(
            `INSERT INTO qrcodecustomers
            (name, contactperson, presentaddress, city, pincode, emailid, mobilenumber, createtime, referer, modifiedby)
            VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8,$9)
            RETURNING id`,
            [
                name,
                contactperson,
                presentaddress,
                city,
                pincode,
                emailid,
                mobilenumber,
                referer,
                modifiedby
            ]
        );

        return rows[0];
    }

    // Legacy support
    async insertCustomer(params) {
        const { rows } = await pool.query(
            `INSERT INTO qrcodecustomers
            (name, contactperson, presentaddress, city, pincode, emailid, mobilenumber, createtime, referer, modifiedby)
            VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),$8,$9)
            RETURNING id`,
            params
        );
        return rows[0];
    }

    /* =========================
     * QR TOKEN
     * ========================= */

    async createToken(data) {
        const { customerid, qrtoken, modifiedby } = data;

        const { rows } = await pool.query(
            `INSERT INTO qrcodetoken
            (customerid, qrtoken, createtime, modifiedby, validfrom, validto)
            VALUES ($1,$2,NOW(),$3,NOW(),NOW())
            RETURNING *`,
            [customerid, qrtoken, modifiedby]
        );

        return rows[0];
    }

    // Legacy alias
    async insertToken(params) {
        const { rows } = await pool.query(
            `INSERT INTO qrcodetoken
            (customerid, qrtoken, createtime, modifiedby, validfrom, validto)
            VALUES ($1,$2,NOW(),$3,NOW(),NOW())
            RETURNING *`,
            params
        );
        return rows[0];
    }

    /* =========================
     * QR RESPONSE
     * ========================= */

    async createResponse(data) {
        const { firstname, location, mobile, productname, qrtoken } = data;

        const { rows } = await pool.query(
            `INSERT INTO qrresponse
            (firstname, location, mobile, productname, qrtoken, createdon)
            VALUES ($1,$2,$3,$4,$5,NOW())
            RETURNING *`,
            [firstname, location, mobile, productname, qrtoken]
        );

        return rows[0];
    }

    // Legacy alias
    async insertResponse(params) {
        const { rows } = await pool.query(
            `INSERT INTO qrresponse
            (firstname, location, mobile, productname, qrtoken, createdon)
            VALUES ($1,$2,$3,$4,$5,NOW())
            RETURNING *`,
            params
        );
        return rows[0];
    }

    /* =========================
     * LEAD FROM QR
     * ========================= */

    async insertLeadFromQR(params) {
        const { rows } = await pool.query(
            `INSERT INTO leadpersonaldetails
            (firstname, mobilenumber, locationid, presentaddress, productname,
             organizationid, createdon, contacttype, status, lastname)
            VALUES ($1,$2,$3,$4,$5,$6,NOW(),$7,$8,$9)
            RETURNING *`,
            params
        );
        return rows[0];
    }

    /* =========================
     * REPORTS
     * ========================= */

    async getQRResponseList() {
        const { rows } = await pool.query("SELECT * FROM getqresponse()");
        return rows;
    }

    // Legacy alias
    async selectResponseList() {
        return this.getQRResponseList();
    }
}

module.exports = new QRModel();
