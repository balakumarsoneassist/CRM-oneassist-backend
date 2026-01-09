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

    async findByMobile(mobileno) {
        const { rows } = await pool.query(
            "SELECT * FROM salesvisitcustomers WHERE mobileno = $1",
            [mobileno]
        );
        return rows[0];
    }

    // Alias
    async selectCustomerList(empid) {
        return this.findBasicCustomersByEmp(empid);
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
        console.log('🔍 Executing findBasicCustomersByEmp for EmpID:', empid);
        const { rows } = await pool.query(
            `
            SELECT 
                s.id, 
                s.name, 
                s.mobileno, 
                s.location, 
                s.contactflag, 
                (
                    SELECT t.appoinmentdate 
                    FROM leadpersonaldetails l 
                    JOIN leadtrackdetails t ON l.id = t.leadid 
                    WHERE TRIM(l.mobilenumber) = TRIM(s.mobileno)
                    AND t.isdirectmeet = true 
                    LIMIT 1
                ) as appoinment_date,
                (SELECT MAX(dateofvisit) FROM salesvisittrack WHERE custid = s.id) as lastvisit,
                (SELECT COUNT(*) FROM salesvisittrack WHERE custid = s.id) as novisit,
                'customer' as record_type
            FROM salesvisitcustomers s
            WHERE s.createdby = $1::integer AND s.contactflag = false

            UNION ALL

            SELECT 
                l.id, 
                (l.firstname || ' ' || COALESCE(l.lastname, '')) as name, 
                l.mobilenumber as mobileno, 
                l.presentaddress as location, 
                false as contactflag, 
                t.appoinmentdate as appoinment_date,
                (
                    SELECT MAX(st.dateofvisit) 
                    FROM salesvisittrack st 
                    JOIN salesvisitcustomers sc ON st.custid = sc.id 
                    WHERE TRIM(sc.mobileno) = TRIM(l.mobilenumber)
                ) as lastvisit,
                (
                    SELECT COUNT(*) 
                    FROM salesvisittrack st 
                    JOIN salesvisitcustomers sc ON st.custid = sc.id 
                    WHERE TRIM(sc.mobileno) = TRIM(l.mobilenumber)
                ) as novisit,
                'lead' as record_type
            FROM leadpersonaldetails l
            JOIN leadtrackdetails t ON l.id = t.leadid
            WHERE t.isdirectmeet = true 
            AND t.contactfollowedby = $1::integer
            AND TRIM(l.mobilenumber) NOT IN (SELECT TRIM(mobileno) FROM salesvisitcustomers WHERE createdby = $1::integer AND contactflag = false)
            `,
            [empid]
        );
        const nandha = rows.find(r => r.name && r.name.toLowerCase().includes('nandha'));
        if (nandha) {
            console.log('🔍 Debug Nandha Row:', JSON.stringify(nandha));
        }
        console.log('✅ findBasicCustomersByEmp result count:', rows.length);
        return rows;
    }

    // Alias
    async selectCustomersByEmp(empid) {
        return this.findBasicCustomersByEmp(empid);
    }
}

module.exports = new SalesModel();
