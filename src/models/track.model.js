const pool = require("../db/index");

class TrackModel {
    async createHistory(data) {
        const fields = ["tracknumber", "leadid", "appoinmentdate", "status", "notes", "isdirectmeet", "createon", "contactfollowedby", "leadfollowedby"];
        const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(", ");
        const values = fields.map(col => data[col] !== undefined ? data[col] : null);

        const { rows } = await pool.query(`INSERT INTO leadtrackhistorydetails (${fields.join(", ")}) VALUES (${placeholders}) RETURNING *`, values);
        return rows[0];
    }

    async createDetails(data) {
        const fields = [
            "leadid", "appoinmentdate", "status", "notes", "isdirectmeet", "occupationtype", "loantype",
            "desireloanamount", "tenure", "preferedbank", "cibilscore", "incometype", "incomeamount",
            "isidproof", "isageproof", "isaddessproof", "iscreditcardstatement", "isexistingloantrack",
            "iscurrentaccountstatement", "isstabilityproof", "isbankstatement", "ispayslip", "isform16",
            "isbusinessproof", "isitr", "isgststatement", "isencumbrancecertificate", "istitledeed",
            "isparentdeed", "islayoutplan", "isregulationorder", "isbuildingpermit", "ispropertytax",
            "ispatta", "isconstructionagreement", "issaleagreement", "isapf", "isudsregistration",
            "isrcbook", "bankname", "applicationnumber", "logindate", "loginvalue", "sanctionroi",
            "sanctiontenure", "sanctionletter", "sanctionvalue", "sanctiondate", "psdcondition",
            "islegal", "istechnical", "legalreport", "technicalreport", "ispsdconditionverified",
            "modifyon", "contactfollowedby", "leadfollowedby", "isnoresponse", "organizationid",
            "payoutpercent", "ispaid", "connectorcontactid", "disbursementamount", "customername",
            "datastrength", "compname", "compcat", "custsegment", "approval_status"
        ];

        // Ensure approval_status is set to Pending if not provided
        if (!data.approval_status) {
            data.approval_status = 'Pending';
        }

        const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(", ");
        const values = fields.map(col => data[col] !== undefined ? data[col] : null);

        const { rows } = await pool.query(`INSERT INTO leadtrackdetails (${fields.join(", ")}) VALUES (${placeholders}) RETURNING *`, values);
        return rows[0];
    }

    async updateDetails(tracknumber, updates, values) {
        const query = `UPDATE leadtrackdetails SET ${updates.join(", ")} WHERE tracknumber = $${values.length} RETURNING *`;
        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    async updateApprovalStatus(tracknumber, status) {
        const { rows } = await pool.query(
            "UPDATE leadtrackdetails SET approval_status = $1 WHERE tracknumber = $2 RETURNING *",
            [status, tracknumber]
        );
        return rows[0];
    }

    async findHistoryByTrack(tracknumber) {
        // Resolve leadid from tracknumber or id to ensure we get all history for the lead
        const { rows: leadRows } = await pool.query(
            "SELECT leadid FROM leadtrackdetails WHERE tracknumber = $1 OR CAST(id AS VARCHAR) = $1 LIMIT 1",
            [tracknumber]
        );

        let query = `
            SELECT lp.leadid, lp.createon, lp.notes, lp.appoinmentdate, s.status, lp.contactfollowedby, lp.tracknumber, lp.isdirectmeet, e.name as employee_name
            FROM leadtrackhistorydetails lp
            JOIN statuscode s ON lp.status = s.id
            LEFT JOIN employeedetails e ON lp.contactfollowedby = e.id
            WHERE lp.tracknumber = $1
        `;
        const params = [tracknumber];

        // If we found a leadid, include history matched by leadid as well
        if (leadRows.length > 0 && leadRows[0].leadid) {
            query += ` OR lp.leadid = $2`;
            params.push(leadRows[0].leadid);
        }

        query += ` ORDER BY lp.createon DESC`;

        const { rows } = await pool.query(query, params);
        return rows;
    }

    async findDetailsByTrack(tracknumber) {
        const { rows } = await pool.query("SELECT * FROM leadtrackdetails WHERE tracknumber = $1", [tracknumber]);
        return rows[0];
    }

    async getOverallStatus(orgid) {
        const { rows } = await pool.query("SELECT * FROM OverallStatus($1)", [orgid]);
        return rows;
    }

    async getLeadFollowedByAll(orgid, statuscode) {
        const { rows } = await pool.query("SELECT * FROM LeadFollowedByAll($1, $2)", [orgid, statuscode]);
        return rows;
    }

    async getContactFollowedByAll(orgid, statuscode) {
        const { rows } = await pool.query("SELECT * FROM ContactFollowedByAll($1, $2)", [orgid, statuscode]);
        return rows;
    }
}

module.exports = new TrackModel();
