const pool = require('../db/index');

class ReportModel {
    async selectOverallStatus(orgid) {
        const { rows } = await pool.query('SELECT * FROM OverallStatus($1)', [orgid]);
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
        const { rows } = await pool.query('SELECT * FROM getUserReport($1, $2, $3)', [assignee, startdate, enddate]);
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
