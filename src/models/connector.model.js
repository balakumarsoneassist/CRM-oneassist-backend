const pool = require("../db/index"); // ✅ use one pool consistently

class ConnectorModel {

    /* =========================
     * CONNECTOR
     * ========================= */

    // Create connector (object-based)
    async create(data) {
        const { name, mobilenumber, emailid, password, isactive, location, createdby } = data;

        const { rows } = await pool.query(
            `INSERT INTO connector 
            (name, mobilenumber, emailid, password, isactive, location, createdby, "createdDate", "updatedDate")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING id`,
            [name, mobilenumber, emailid, password, isactive, location, createdby]
        );

        return rows[0];
    }

    // Create connector (params-based – backward compatibility)
    async insertConnector(params) {
        const { rows } = await pool.query(
            `INSERT INTO connector 
            (name, mobilenumber, emailid, password, isactive, location, createdby, "createdDate", "updatedDate")
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING id`,
            params
        );
        return rows[0];
    }

    async findById(id) {
        const { rows } = await pool.query(
            "SELECT * FROM connector WHERE id = $1",
            [id]
        );
        return rows[0];
    }

    async findByMobile(mobilenumber) {
        const { rows } = await pool.query(
            "SELECT * FROM connector WHERE mobilenumber = $1 AND isactive = true",
            [mobilenumber]
        );
        return rows[0];
    }

    // Alias for backward compatibility
    async findByMobileAndActive(mobile) {
        return this.findByMobile(mobile);
    }

    async update(id, data) {
        const { name, mobilenumber, emailid, isactive, location, createdby } = data;

        const { rows } = await pool.query(
            `UPDATE connector 
             SET name = $1, mobilenumber = $2, emailid = $3, isactive = $4, location = $5, createdby = $6, "updatedDate" = NOW()
             WHERE id = $7 
             RETURNING *`,
            [name, mobilenumber, emailid, isactive, location, createdby, id]
        );

        return rows[0];
    }

    // Dynamic update (advanced usage)
    async updateConnector(query, params) {
        const { rows } = await pool.query(query, params);
        return rows[0];
    }

    async getConnectorList() {
        const { rows } = await pool.query("SELECT * FROM getconnectorlist()");
        return rows;
    }

    // Alias
    async selectConnectorList() {
        return this.getConnectorList();
    }

    /* =========================
     * CONNECTOR CONTACT
     * ========================= */

    async createContact(data) {
        const {
            firstname,
            mobilenumber,
            emailid,
            loantype,
            connectorid,
            organisationid,
            locationid,
            loanmount,
            istrack = false
        } = data;

        const { rows } = await pool.query(
            `INSERT INTO connectorcontact 
            (firstname, mobilenumber, emailid, loantype, createddate, connectorid, organisationid, locationid, loanmount, istrack)
            VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9)
            RETURNING *`,
            [
                firstname,
                mobilenumber,
                emailid,
                loantype,
                connectorid,
                organisationid,
                locationid,
                loanmount,
                istrack
            ]
        );

        return rows[0];
    }

    // Params-based (legacy support)
    async insertConnectorContact(params) {
        const { rows } = await pool.query(
            `INSERT INTO connectorcontact 
            (firstname, mobilenumber, emailid, loantype, createddate, connectorid, organisationid, locationid, loanmount, istrack)
            VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9)
            RETURNING *`,
            params
        );
        return rows[0];
    }
}

module.exports = new ConnectorModel();
