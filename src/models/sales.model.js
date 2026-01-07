const pool = require('../db/index');

class SalesModel {
    async insertCustomer(params) {
        const { rows } = await pool.query(`INSERT INTO salesvisitcustomers (name, mobileno, profession, designation, location, distance, notes, createdby, modifiedby, contactflag) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9) RETURNING id, *`, params);
        return rows[0];
    }

    async insertTrack(params) {
        const { rows } = await pool.query(`INSERT INTO salesvisittrack (custid, dateofvisit, nextvisit, remarks, modifiedby) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`, params);
        return rows[0];
    }

    async selectCustomerList(empid) {
        const { rows } = await pool.query('SELECT * FROM salesvisitcustomers WHERE createdby = $1 AND contactflag = false', [empid]);
        return rows;
    }

    async selectTrackByCustId(custid) {
        const { rows } = await pool.query('SELECT id, dateofvisit, nextvisit, remarks FROM salesvisittrack WHERE custid = $1', [custid]);
        return rows;
    }

    async updateCustomerFlag(id) {
        const { rows } = await pool.query('UPDATE salesvisitcustomers SET contactflag = true, modifiedby = NOW() WHERE id = $1 RETURNING *', [parseInt(id)]);
        return rows[0];
    }

    async selectAllCustomersCount() {
        const { rows } = await pool.query('SELECT * FROM SalesVisitCustomerCount()');
        return rows;
    }

    async selectCustomersByEmp(empid) {
        const { rows } = await pool.query('SELECT id, name, mobileno, location FROM salesvisitcustomers WHERE createdby = $1', [empid]);
        return rows;
    }
}

module.exports = new SalesModel();
