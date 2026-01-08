const pool = require("../db/index"); // single pool source

class LeadModel {

    /* =========================
     * PERSONAL DETAILS
     * ========================= */

    // New style
    async createPersonal(values) {
        const { rows } = await pool.query(
            `INSERT INTO leadpersonaldetails (
                firstname, lastname, mobilenumber, locationid, email, dateofbirth,
                pannumber, aadharnumber, presentaddress, pincode, permanentaddress,
                gender, materialstatus, noofdependent, educationalqualification, type,
                status, referencename, organizationid, createdon, connectorid,
                createdby, productname, remarks, connectorcontactid, extcustomerid,
                contacttype, whatsappnumber
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
                $21,$22,$23,$24,$25,$26,$27,$28
            ) RETURNING *`,
            values
        );
        return rows[0];
    }

    // Legacy alias
    async insertPersonal(values) {
        return this.createPersonal(values);
    }

    async findPersonal(whereClause, values) {
        const dataQuery = `
            SELECT * FROM leadpersonaldetails
            ${whereClause}
            ORDER BY id DESC
            LIMIT $${values.length - 1} OFFSET $${values.length}
        `;
        const countQuery = `
            SELECT COUNT(*) FROM leadpersonaldetails
            ${whereClause}
        `;

        const [{ rows: dataRows }, { rows: countRows }] = await Promise.all([
            pool.query(dataQuery, values),
            pool.query(countQuery, values.slice(0, values.length - 2)),
        ]);

        return { dataRows, count: countRows[0].count };
    }

    async selectPersonalList(dataQuery, countQuery, values, countValues) {
        const [{ rows: dataRows }, { rows: countRows }] = await Promise.all([
            pool.query(dataQuery, values),
            pool.query(countQuery, countValues),
        ]);
        return { dataRows, count: countRows[0].count };
    }

    async findPersonalById(id) {
        const { rows } = await pool.query(
            "SELECT * FROM leadpersonaldetails WHERE id=$1",
            [id]
        );
        return rows[0];
    }

    // Legacy alias
    async selectPersonalById(id) {
        return this.findPersonalById(id);
    }

    async updatePersonal(idOrQuery, updatesOrValues, values) {
        // Supports both styles
        if (typeof idOrQuery === "string") {
            const { rows } = await pool.query(idOrQuery, updatesOrValues);
            return rows[0];
        }

        const query = `
            UPDATE leadpersonaldetails
            SET ${updatesOrValues.join(", ")}
            WHERE id = $${values.length}
            RETURNING *
        `;
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    async updateStatus(id, status) {
        await pool.query(
            "UPDATE leadpersonaldetails SET status=$1 WHERE id=$2",
            [status, id]
        );
    }

    /* =========================
     * OCCUPATION DETAILS
     * ========================= */

    async createOccupation(data) {
        const {
            leadpersonal, occupation, incometype, companyname,
            companyaddress, designation, joiningdate,
            officetelephonenumber, companygstinnumber, incomeamount
        } = data;

        const { rows } = await pool.query(
            `INSERT INTO leadoccupationdetails
            (leadpersonal, occupation, incometype, companyname, companyaddress,
             designation, joiningdate, officetelephonenumber,
             companygstinnumber, incomeamount)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            RETURNING *`,
            [
                leadpersonal, occupation, incometype, companyname,
                companyaddress, designation, joiningdate,
                officetelephonenumber, companygstinnumber, incomeamount
            ]
        );
        return rows[0];
    }

    async insertOccupation(params) {
        return this.createOccupation({
            leadpersonal: params[0],
            occupation: params[1],
            incometype: params[2],
            companyname: params[3],
            companyaddress: params[4],
            designation: params[5],
            joiningdate: params[6],
            officetelephonenumber: params[7],
            companygstinnumber: params[8],
            incomeamount: params[9],
        });
    }

    async updateOccupation(idOrUpdates, values) {
        if (Array.isArray(values)) {
            const { rows } = await pool.query(
                `UPDATE leadoccupationdetails SET ${idOrUpdates.join(", ")}
                 WHERE id = $${values.length} RETURNING *`,
                values
            );
            return rows[0];
        }

        const { rows } = await pool.query(
            `UPDATE leadoccupationdetails SET
                leadpersonal = COALESCE($1, leadpersonal),
                occupation = COALESCE($2, occupation),
                incometype = COALESCE($3, incometype),
                companyname = COALESCE($4, companyname),
                companyaddress = COALESCE($5, companyaddress),
                designation = COALESCE($6, designation),
                joiningdate = COALESCE($7, joiningdate),
                officetelephonenumber = COALESCE($8, officetelephonenumber),
                companygstinnumber = COALESCE($9, companygstinnumber),
                incomeamount = COALESCE($10, incomeamount)
             WHERE id = $11 RETURNING *`,
            idOrUpdates
        );
        return rows[0];
    }

    async findOccupationByLeadPersonal(leadpersonal) {
        const { rows } = await pool.query(
            "SELECT * FROM leadoccupationdetails WHERE leadpersonal = $1",
            [leadpersonal]
        );
        return rows;
    }

    // Alias
    async selectOccupationByLead(leadpersonal) {
        return this.findOccupationByLeadPersonal(leadpersonal);
    }

    /* =========================
     * BANK DETAILS
     * ========================= */

    async createBank(data) {
        const { leadpersonal, bankname, branch, ifsccode, accountnumber } = data;
        const { rows } = await pool.query(
            `INSERT INTO leadbankdetails
            (leadpersonal, bankname, branch, ifsccode, accountnumber)
            VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [leadpersonal, bankname, branch, ifsccode, accountnumber]
        );
        return rows[0];
    }

    async insertBank(params) {
        const { rows } = await pool.query(
            `INSERT INTO leadbankdetails
            (leadpersonal, bankname, branch, ifsccode, accountnumber)
            VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            params
        );
        return rows[0];
    }

    async updateBank(idOrUpdates, values) {
        if (Array.isArray(values)) {
            const { rows } = await pool.query(
                `UPDATE leadbankdetails SET ${idOrUpdates.join(", ")}
                 WHERE id = $${values.length} RETURNING *`,
                values
            );
            return rows[0];
        }

        const { rows } = await pool.query(
            `UPDATE leadbankdetails SET
                leadpersonal = COALESCE($1, leadpersonal),
                bankname = COALESCE($2, bankname),
                branch = COALESCE($3, branch),
                ifsccode = COALESCE($4, ifsccode),
                accountnumber = COALESCE($5, accountnumber)
             WHERE id = $6 RETURNING *`,
            idOrUpdates
        );
        return rows[0];
    }

    async findBankByLeadPersonal(leadpersonal) {
        const { rows } = await pool.query(
            "SELECT * FROM leadbankdetails WHERE leadpersonal = $1",
            [leadpersonal]
        );
        return rows;
    }

    // Alias
    async selectBankByLead(leadpersonal) {
        return this.findBankByLeadPersonal(leadpersonal);
    }

    /* =========================
     * LOAN HISTORY
     * ========================= */

    async createLoanHistory(data) {
        const {
            leadpersonal, loantype, roi, loanamount,
            bankname, branchname, disbursementdate, tenure
        } = data;

        const { rows } = await pool.query(
            `INSERT INTO leadloanhistorydetails
            (leadpersonal, loantype, roi, loanamount,
             bankname, branchname, disbursementdate, tenure)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [
                leadpersonal, loantype, roi, loanamount,
                bankname, branchname, disbursementdate, tenure
            ]
        );
        return rows[0];
    }

    async insertLoanHistory(params) {
        return this.createLoanHistory({
            leadpersonal: params[0],
            loantype: params[1],
            roi: params[2],
            loanamount: params[3],
            bankname: params[4],
            branchname: params[5],
            disbursementdate: params[6],
            tenure: params[7],
        });
    }

    async updateLoanHistory(idOrUpdates, values) {
        if (Array.isArray(values)) {
            const { rows } = await pool.query(
                `UPDATE leadloanhistorydetails SET ${idOrUpdates.join(", ")}
                 WHERE id = $${values.length} RETURNING *`,
                values
            );
            return rows[0];
        }

        const { rows } = await pool.query(
            `UPDATE leadloanhistorydetails SET
                leadpersonal = COALESCE($1, leadpersonal),
                loantype = COALESCE($2, loantype),
                roi = COALESCE($3, roi),
                loanamount = COALESCE($4, loanamount),
                bankname = COALESCE($5, bankname),
                branchname = COALESCE($6, branchname),
                disbursementdate = COALESCE($7, disbursementdate),
                tenure = COALESCE($8, tenure)
             WHERE id = $9 RETURNING *`,
            idOrUpdates
        );
        return rows[0];
    }

    async findLoanHistoryByLeadPersonal(leadpersonal) {
        const { rows } = await pool.query(
            "SELECT * FROM leadloanhistorydetails WHERE leadpersonal = $1",
            [leadpersonal]
        );
        return rows;
    }

    // Alias
    async selectLoanHistoryByLead(leadpersonal) {
        return this.findLoanHistoryByLeadPersonal(leadpersonal);
    }

    /* =========================
     * TRACKING
     * ========================= */

    async insertTrackHistory(query, values) {
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    async insertTrackDetails(query, values) {
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    async updateTrackDetails(query, values) {
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    async selectCallHistory(tracknumber) {
        const { rows } = await pool.query(
            `SELECT lp.leadid, lp.createon, lp.notes, lp.appoinmentdate,
                    s.status, lp.contactfollowedby, lp.tracknumber
             FROM leadtrackhistorydetails lp
             JOIN statuscode s ON lp.status = s.id
             WHERE lp.tracknumber = $1
             ORDER BY lp.createon DESC`,
            [tracknumber]
        );
        return rows;
    }

    async selectTrackDetails(tracknumber) {
        const { rows } = await pool.query(
            "SELECT * FROM leadtrackdetails WHERE tracknumber = $1",
            [tracknumber]
        );
        return rows[0];
    }

    async updateLeadTrackCustomerFlag(leadid) {
        await pool.query(
            "UPDATE leadtrackdetails SET customer = true WHERE leadid = $1",
            [leadid]
        );
    }

    async selectTrackDetailsByLeadId(leadid) {
        const { rows } = await pool.query(
            `SELECT * FROM leadtrackdetails
             WHERE leadid = $1
             ORDER BY tracknumber DESC
             LIMIT 1`,
            [leadid]
        );
        return rows[0];
    }
}

module.exports = new LeadModel();
