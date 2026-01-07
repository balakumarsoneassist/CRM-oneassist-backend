const pool = require('../db/index');

class CustomerModel {
    async findLeadById(id) {
        const { rows } = await pool.query('SELECT firstname, mobilenumber, email FROM leadpersonaldetails WHERE id = $1', [id]);
        return rows[0];
    }

    async insertCustomer(params) {
        const { rows } = await pool.query(`INSERT INTO customers (name, loandate, location, mobilenumber, product, email, status, bank, disbursedvalue, profile, remarks, notes, newstatus, leadid, leadfollowedby, createdon) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW()) RETURNING *`, params);
        return rows[0];
    }

    async updateLeadTrackFlag(leadid) {
        await pool.query('UPDATE leadtrackdetails SET customer = true WHERE leadid = $1', [leadid]);
    }

    async selectTodayAppointment(empid) {
        const { rows } = await pool.query('SELECT * FROM GetTodayAppoinment($1)', [empid]);
        return rows;
    }

    async selectCustomerList() {
        const { rows } = await pool.query('SELECT * FROM GetCustomerList()');
        return rows;
    }
}

module.exports = new CustomerModel();
