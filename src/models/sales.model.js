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

    // Upsert style (handles existing mobile numbers)
    async insertCustomer(params) {
        // params: [name, mobileno, profession, designation, location, distance, notes, createdby, contactflag]
        const { rows } = await pool.query(
            `INSERT INTO salesvisitcustomers
            (name, mobileno, profession, designation, location, distance, notes, createdby, modifiedby, contactflag)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
            ON CONFLICT (mobileno) 
            DO UPDATE SET 
                createdby = EXCLUDED.createdby,
                notes = EXCLUDED.notes,
                contactflag = EXCLUDED.contactflag,
                modifiedby = NOW()
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
        console.log('[SALES MODEL] findCustomersByEmp - querying for:', empid);

        // Ensure empid is a number or null
        const numericEmpId = (empid && !isNaN(parseInt(empid))) ? parseInt(empid) : null;

        const { rows } = await pool.query(
            `SELECT 
                c.id, c.name, c.mobileno, c.profession, c.designation, 
                c.location, c.distance, c.notes, c.createdby, c.modifiedby, c.contactflag,
                COUNT(t.id) as novisit,
                MAX(t.dateofvisit) as lastvisit,
                STRING_AGG(DISTINCT t.remarks, ' | ') as all_remarks
             FROM salesvisitcustomers c
             LEFT JOIN salesvisittrack t ON c.id = t.custid
             WHERE (c.createdby = $1 OR c.createdby IS NULL)
               AND (c.contactflag = false OR c.contactflag IS NULL)
               AND c.name NOT ILIKE '%Test%'
             GROUP BY 
                c.id, c.name, c.mobileno, c.profession, c.designation, 
                c.location, c.distance, c.notes, c.createdby, c.modifiedby, c.contactflag
             ORDER BY MAX(t.dateofvisit) DESC NULLS LAST, c.id DESC`,
            [numericEmpId]
        );
        console.log(`[SALES MODEL] findCustomersByEmp - Result count: ${rows.length}`);
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
        const numericEmpId = (empid && !isNaN(parseInt(empid))) ? parseInt(empid) : null;
        const { rows } = await pool.query(
            `SELECT id, name, mobileno, location
             FROM salesvisitcustomers
             WHERE createdby = $1`,
            [numericEmpId]
        );
        return rows;
    }

    // Alias
    async selectCustomersByEmp(empid) {
        return this.findBasicCustomersByEmp(empid);
    }
}

module.exports = new SalesModel();
