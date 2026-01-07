const pool = require("../db/index");

class MetricsModel {
    async getTargetMetrics(employeeId) {
        const { rows } = await pool.query(
            `SELECT logins, sanctions, disbursement_volume, attended_calls_target, converted_leads 
       FROM targetmetrics WHERE employee_id = $1`, [employeeId]
        );
        return rows[0] || {};
    }

    async getAttendedCallsCount(employeeId) {
        const { rows } = await pool.query(
            `SELECT COUNT(*) as count FROM leadtrackhistorydetails WHERE contactfollowedby = $1`, [employeeId]
        );
        return parseInt(rows[0].count) || 0;
    }

    async getConvertedLeadsCount(employeeId) {
        const { rows } = await pool.query(
            `SELECT COUNT(*) as count FROM customers WHERE leadfollowedby = $1`, [employeeId]
        );
        return parseInt(rows[0].count) || 0;
    }

    async getLoginsCount(employeeId) {
        const { rows } = await pool.query(
            `SELECT COUNT(*) as count FROM customers 
       WHERE leadfollowedby = $1 
       AND (status IN ('13', '15', '17', '18') 
            OR status ILIKE 'filelogin' OR status ILIKE 'sanction' OR status ILIKE 'disbursement' OR status ILIKE 'completed')`, [employeeId]
        );
        return parseInt(rows[0].count) || 0;
    }

    async getSanctionsCount(employeeId) {
        const { rows } = await pool.query(
            `SELECT COUNT(*) as count FROM customers 
       WHERE leadfollowedby = $1 
       AND (status IN ('15', '17', '18')
            OR status ILIKE 'sanction' OR status ILIKE 'disbursement' OR status ILIKE 'completed')`, [employeeId]
        );
        return parseInt(rows[0].count) || 0;
    }

    async getDisbursementValue(employeeId) {
        const { rows } = await pool.query(
            `SELECT COALESCE(SUM(CAST(ltd.desireloanamount AS NUMERIC)), 0) as total 
       FROM customers c
       JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
       WHERE c.leadfollowedby = $1 
       AND (c.status::text IN ('17', '18', 'Disbursed') 
            OR c.status::text ILIKE 'disbursement' OR c.status::text ILIKE 'completed')
       AND ltd.id = (SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid)`, [employeeId]
        );
        return parseFloat(rows[0].total) || 0;
    }

    async updateTargetMetrics(id, data) {
        const { logins, sanctions, disbursement_volume, attended_calls_target, converted_leads } = data;
        const { rows } = await pool.query(
            `INSERT INTO targetmetrics (employee_id, logins, sanctions, disbursement_volume, attended_calls_target, converted_leads, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT ON CONSTRAINT targetmetrics_employee_id_key DO UPDATE SET
         logins = COALESCE($2, targetmetrics.logins),
         sanctions = COALESCE($3, targetmetrics.sanctions),
         disbursement_volume = COALESCE($4, targetmetrics.disbursement_volume),
         attended_calls_target = COALESCE($5, targetmetrics.attended_calls_target),
         converted_leads = COALESCE($6, targetmetrics.converted_leads),
         updated_at = NOW()
       RETURNING *`,
            [id, logins, sanctions, disbursement_volume, attended_calls_target, converted_leads]
        );
        return rows[0];
    }

    async getAssignedEmployees() {
        const { rows } = await pool.query(
            `SELECT e.id, e.name, e.designation, t.logins, t.sanctions, t.disbursement_volume, 
              t.attended_calls_target, t.converted_leads
       FROM employeedetails e
       JOIN targetmetrics t ON e.id = t.employee_id
       WHERE e.isactive = true
       ORDER BY e.name ASC`
        );
        return rows;
    }

    async getUnassignedEmployees() {
        const { rows } = await pool.query(
            `SELECT e.id, e.name, e.designation
       FROM employeedetails e
       LEFT JOIN targetmetrics t ON e.id = t.employee_id
       WHERE t.id IS NULL AND e.isactive = true AND e.isadminrights = false
       ORDER BY e.name ASC`
        );
        return rows;
    }
}

module.exports = new MetricsModel();
