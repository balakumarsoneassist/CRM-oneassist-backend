const pool = require("../db/index"); // single pool source

class MasterModel {

    /* =========================
     * BRANCH MASTER
     * ========================= */

    // New style (object-based)
    async createBranch(data) {
        const { location, name, isactive } = data;
        const { rows } = await pool.query(
            `INSERT INTO branchmaster (location, name, isactive)
             VALUES ($1, $2, $3) RETURNING *`,
            [location, name, isactive]
        );
        return rows[0];
    }

    // Legacy support (params-based)
    async insertBranch(params) {
        const { rows } = await pool.query(
            `INSERT INTO branchmaster (location, name, isactive)
             VALUES ($1, $2, $3) RETURNING *`,
            params
        );
        return rows[0];
    }

    async updateBranch(idOrParams, data) {
        // Legacy style
        if (Array.isArray(idOrParams)) {
            const { rows } = await pool.query(
                `UPDATE branchmaster
                 SET location = COALESCE($1, location),
                     name = COALESCE($2, name),
                     isactive = COALESCE($3, isactive)
                 WHERE id = $4 RETURNING *`,
                idOrParams
            );
            return rows[0];
        }

        // New style
        const { location, name, isactive } = data;
        const { rows } = await pool.query(
            `UPDATE branchmaster
             SET location = COALESCE($1, location),
                 name = COALESCE($2, name),
                 isactive = COALESCE($3, isactive)
             WHERE id = $4 RETURNING *`,
            [
                location ?? null,
                name ?? null,
                typeof isactive !== "undefined" ? isactive : null,
                idOrParams
            ]
        );
        return rows[0];
    }

    async findBranches(whereClause = "", values = []) {
        const { rows } = await pool.query(
            `SELECT * FROM branchmaster ${whereClause} ORDER BY id DESC`,
            values
        );
        return rows;
    }

    // Legacy alias
    async selectBranches(query, values) {
        const { rows } = await pool.query(query, values);
        return rows;
    }

    /* =========================
     * LOCATION MASTER
     * ========================= */

    async createLocation(data) {
        const { location, state } = data;
        const { rows } = await pool.query(
            `INSERT INTO locationmaster (location, state)
             VALUES ($1, $2) RETURNING *`,
            [location, state]
        );
        return rows[0];
    }

    async insertLocation(params) {
        const { rows } = await pool.query(
            `INSERT INTO locationmaster (location, state)
             VALUES ($1, $2) RETURNING *`,
            params
        );
        return rows[0];
    }

    async updateLocation(idOrParams, data) {
        // Legacy
        if (Array.isArray(idOrParams)) {
            const { rows } = await pool.query(
                `UPDATE locationmaster
                 SET location = COALESCE($1, location),
                     state = COALESCE($2, state)
                 WHERE id = $3 RETURNING *`,
                idOrParams
            );
            return rows[0];
        }

        // New
        const { location, state } = data;
        const { rows } = await pool.query(
            `UPDATE locationmaster
             SET location = COALESCE($1, location),
                 state = COALESCE($2, state)
             WHERE id = $3 RETURNING *`,
            [location ?? null, state ?? null, idOrParams]
        );
        return rows[0];
    }

    async findLocations(whereClause = "", values = []) {
        const { rows } = await pool.query(
            `SELECT * FROM locationmaster ${whereClause} ORDER BY id DESC`,
            values
        );
        return rows;
    }

    // Legacy alias
    async selectLocations(query, values) {
        const { rows } = await pool.query(query, values);
        return rows;
    }

    /* =========================
     * BANK MASTER
     * ========================= */

    async insertBank(params) {
        const { rows } = await pool.query(
            `INSERT INTO bankmaster (bankname)
             VALUES ($1) RETURNING *`,
            params
        );
        return rows[0];
    }

    async updateBank(params) {
        const { rows } = await pool.query(
            `UPDATE bankmaster
             SET bankname = $1
             WHERE id = $2 RETURNING *`,
            params
        );
        return rows[0];
    }

    async selectBanks() {
        const { rows } = await pool.query(
            "SELECT * FROM bankmaster ORDER BY bankname ASC"
        );
        return rows;
    }

    async selectBankById(id) {
        const { rows } = await pool.query(
            "SELECT * FROM bankmaster WHERE id = $1",
            [id]
        );
        return rows[0];
    }

    /* =========================
     * LOAN MASTER
     * ========================= */

    async selectLoanList() {
        const { rows } = await pool.query("SELECT * FROM GetLoanList()");
        return rows;
    }
}

module.exports = new MasterModel();
