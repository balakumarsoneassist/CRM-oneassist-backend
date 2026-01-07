const pool = require("../db/index"); // single pool source

class SalesModel {

    /* =========================
     * SALES VISIT CUSTOMER
     * ========================= */

    // New style (object-based)
    async createCustomer(data) {
        const {
            name,
            mobileno,
            profession,
            designation,
            location,
            distance,
            notes,
            createdby,
            contactflag = false
        } = data;

        const { rows } = await pool.query(
            `INSERT INTO salesvisitcustomers
            (name, mobileno, profession, designation, location, distance, notes, createdby, modifiedby, contactflag)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9)
            RETURNING id, *`,
            [
                name,
                mobileno,
                profession,
                designation,
                location,
                distance,
                notes,
                createdby,
                contactflag
            ]
        );

        return rows[0];
    }

    // Legacy support (params-based)
    async insertCustomer(params) {
        const { rows } = await pool.query(
            `INSERT INTO salesvisitcustomers
            (name, mobileno, profession, designation, location, distance, notes, createdby, modifiedby, contactflag)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9)
            RETURNING id, *`,
            params
        );
        return rows[0];
    }

    /* =========================
     * SALES VISIT TRACK
     * ========================= */

    async createTrack(data) {
        const { custid, dateofvisit, nextvisit, remarks } = data;

        const { rows } = await pool.query(
            `INSERT INTO salesvisittrack
            (custid, dateofvisit, nextvisit, remarks, modifiedby)
            VALUES ($1,$2,$3,$4,NOW())
            RETURNING *`,
            [custid, dateofvisit, nextvisit, remarks]
        );

        return rows[0];
    }

    // Legacy alias
    async insertTrack(params) {
        const { rows } = await pool.query(
            `INSERT INTO salesvisittrack
            (custid, dateofvisit, nextvisit, remarks, modifiedby)
            VALUES ($1,$2,$3,$4,NOW())
            RETURNING *`,
            params
        );
        return rows[0];
    }

    /* =========================
     * FETCH METHODS
     * ========================= */

    async findCustomersByEmp(empid) {
        const { rows } = await pool.query(
            `SELECT * FROM salesvisitcustomers
             WHERE createdby = $1 AND contactflag = false`,
            [empid]
        );
        return rows;
    }

    // Alias
    async selectCustomerList(empid) {
        return this.findCustomersByEmp(empid);
    }

    async findTrackByCust(custid) {
        const { rows } = await pool.query(
            `SELECT id, dateofvisit, nextvisit, remarks
             FROM salesvisittrack WHERE custid = $1`,
            [custid]
        );
        return rows;
    }

    // Alias
    async selectTrackByCustId(custid) {
        return this.findTrackByCust(custid);
    }

    /* =========================
     * UPDATE METHODS
     * ========================= */

    async updateCustomerFlag(id) {
        const { rows } = await pool.query(
            `UPDATE salesvisitcustomers
             SET contactflag = true, modifiedby = NOW()
             WHERE id = $1
             RETURNING *`,
            [parseInt(id)]
        );
        return rows[0];
    }

    /* =========================
     * REPORTS / COUNTS
     * ========================= */

    async getCustomerCount() {
        const { rows } = await pool.query(
            "SELECT * FROM SalesVisitCustomerCount()"
        );
        return rows;
    }

    // Alias
    async selectAllCustomersCount() {
        return this.getCustomerCount();
    }

    async findBasicCustomersByEmp(empid) {
        const { rows } = await pool.query(
            `SELECT id, name, mobileno, location
             FROM salesvisitcustomers
             WHERE createdby = $1`,
            [empid]
        );
        return rows;
    }

    // Alias
    async selectCustomersByEmp(empid) {
        return this.findBasicCustomersByEmp(empid);
    }
}

module.exports = new SalesModel();
