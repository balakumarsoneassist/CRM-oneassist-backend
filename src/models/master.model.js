const pool = require('../db/index');

class MasterModel {
    async insertBranch(params) {
        const { rows } = await pool.query('INSERT INTO branchmaster (location, name, isactive) VALUES ($1, $2, $3) RETURNING *', params);
        return rows[0];
    }

    async updateBranch(params) {
        const { rows } = await pool.query('UPDATE branchmaster SET location = COALESCE($1, location), name = COALESCE($2, name), isactive = COALESCE($3, isactive) WHERE id=$4 RETURNING *', params);
        return rows[0];
    }

    async selectBranches(query, values) {
        const { rows } = await pool.query(query, values);
        return rows;
    }

    async insertLocation(params) {
        const { rows } = await pool.query('INSERT INTO locationmaster (location, state) VALUES ($1, $2) RETURNING *', params);
        return rows[0];
    }

    async updateLocation(params) {
        const { rows } = await pool.query('UPDATE locationmaster SET location = COALESCE($1, location), state = COALESCE($2, state) WHERE id=$3 RETURNING *', params);
        return rows[0];
    }

    async selectLocations(query, values) {
        const { rows } = await pool.query(query, values);
        return rows;
    }

    async insertBank(params) {
        const { rows } = await pool.query('INSERT INTO bankmaster (bankname) VALUES ($1) RETURNING *', params);
        return rows[0];
    }

    async updateBank(params) {
        const { rows } = await pool.query('UPDATE bankmaster SET bankname = $1 WHERE id = $2 RETURNING *', params);
        return rows[0];
    }

    async selectBanks() {
        const { rows } = await pool.query('SELECT * FROM bankmaster ORDER BY bankname ASC');
        return rows;
    }

    async selectBankById(id) {
        const { rows } = await pool.query('SELECT * FROM bankmaster WHERE id = $1', [id]);
        return rows[0];
    }

    async selectLoanList() {
        const { rows } = await pool.query('SELECT * FROM GetLoanList()');
        return rows;
    }
}

module.exports = new MasterModel();
