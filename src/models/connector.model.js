const pool = require('../db/index');

class ConnectorModel {
    async insertConnector(params) {
        const { rows } = await pool.query(`INSERT INTO connector (name, mobilenumber, emailid, password, isactive, location, createdby, "createdDate", "updatedDate") VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`, params);
        return rows[0];
    }

    async findById(id) {
        const { rows } = await pool.query('SELECT * FROM connector WHERE id = $1', [id]);
        return rows[0];
    }

    async findByMobileAndActive(mobile) {
        const { rows } = await pool.query('SELECT * FROM connector WHERE mobilenumber = $1 AND isactive = true', [mobile]);
        return rows[0];
    }

    async updateConnector(query, params) {
        const { rows } = await pool.query(query, params);
        return rows[0];
    }

    async selectConnectorList() {
        const { rows } = await pool.query('select * from getconnectorlist()');
        return rows;
    }

    async insertConnectorContact(params) {
        const { rows } = await pool.query(`INSERT INTO connectorcontact (firstname, mobilenumber, emailid, loantype, createddate, connectorid, organisationid, locationid, loanmount, istrack) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9) RETURNING *`, params);
        return rows[0];
    }
}

module.exports = new ConnectorModel();
