const pool = require('../db/index');

class ReportModel {
    async selectOverallStatus(orgid, empid) {
        if (empid) {
            // Raw SQL fallback since OverallStatusByEmp function is missing
            // Debug: Check if any tracks exist for this user
            const debugTrackQuery = `SELECT count(*) FROM leadtrackdetails WHERE contactfollowedby = $1`;
            const { rows: debugTrackRows } = await pool.query(debugTrackQuery, [empid]);
            console.log(`DEBUG: Found ${debugTrackRows[0].count} tracks for user ${empid} in leadtrackdetails`);

            const query = `
                SELECT count(l.id) as total, 
                       s.id as statuscode, 
                       s.status, 
                       l.contacttype as type
                FROM leadpersonaldetails l
                JOIN leadtrackdetails t ON l.id = t.leadid
                JOIN statuscode s ON l.status = s.id
                WHERE l.organizationid = $1 AND t.contactfollowedby = $2
                GROUP BY s.id, s.status, l.contacttype
            `;
            const { rows } = await pool.query(query, [orgid, empid]);
            return rows;
        }
        const query = `
                SELECT count(l.id) as total, 
                       s.id as statuscode, 
                       s.status, 
                       l.contacttype as type
                FROM leadpersonaldetails l
                JOIN statuscode s ON l.status = s.id
                WHERE l.organizationid = $1
                GROUP BY s.id, s.status, l.contacttype
            `;
        console.log(`DEBUG: Executing Admin Overall Query for Org: ${orgid}`);
        const { rows } = await pool.query(query, [orgid]);
        console.log(`DEBUG: Admin Query Result Count: ${rows.length}`);
        return rows;
    }

    async selectLeadFollowAllStatus(orgid, statuscode) {
        const { rows } = await pool.query('SELECT * FROM LeadFollowedByAll($1, $2)', [orgid, statuscode]);
        return rows;
    }

    async selectContactFollowAllStatus(orgid, statuscode) {
        const { rows } = await pool.query('SELECT * FROM ContactFollowedByAll($1, $2)', [orgid, statuscode]);
        return rows;
    }

    async selectContactFollowEmp(orgid, statuscode, empid) {
        const { rows } = await pool.query('SELECT * FROM ContactFollowedByEmp($1, $2, $3)', [orgid, statuscode, empid]);
        return rows;
    }

    async selectLeadFollowEmp(orgid, statuscode, empid) {
        const { rows } = await pool.query('SELECT * FROM LeadFollowedByEmp($1, $2, $3)', [orgid, statuscode, empid]);
        return rows;
    }

    async selectUserReport(assignee, startdate, enddate) {
        const query = `
            SELECT 
                t.tracknumber,
                l.firstname || ' ' || COALESCE(l.lastname, '') as name,
                l.mobilenumber,
                l.email as emailid,
                l.presentaddress as location,
                e.name as assigneename,
                s.status,
                t.appoinmentdate,
                l.referencename,
                t.notes,
                t.id
            FROM leadtrackhistorydetails t
            JOIN leadpersonaldetails l ON t.leadid = l.id
            LEFT JOIN employeedetails e ON t.contactfollowedby = e.id
            LEFT JOIN statuscode s ON t.status = s.id
            WHERE t.contactfollowedby = $1
              AND t.createon::date >= $2
              AND t.createon::date <= $3
            ORDER BY t.createon DESC
        `;
        const { rows } = await pool.query(query, [assignee, startdate, enddate]);
        return rows;
    }

    async selectDashboardUser(empid) {
        const { rows } = await pool.query('SELECT * FROM GetDashboarduser($1)', [empid]);
        return rows;
    }

    async selectDashboardAdmin() {
        const { rows } = await pool.query('SELECT * FROM GetDashboardadmin()');
        return rows;
    }

    async getUserReport(orgid, fromdate, todate) {
        const { rows } = await pool.query("SELECT * FROM getUserReport($1, $2, $3)", [orgid, fromdate, todate]);
        return rows;
    }
}

module.exports = new ReportModel();
