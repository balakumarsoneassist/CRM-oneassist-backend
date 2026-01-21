const pool = require("../db/index");

class MetricsModel {
    async getTargetMetrics(employeeId) {
        const { rows } = await pool.query(
            `SELECT logins, sanctions, disbursement_volume, attended_calls_target, converted_leads, revenue_target, revenue_achievement
       FROM targetmetrics WHERE employee_id = $1`, [employeeId]
        );
        return rows[0] || {};
    }

    async getAttendedCallsCount(employeeId) {
        const { rows } = await pool.query(
            `SELECT COUNT(*) as count FROM leadtrackhistorydetails 
             WHERE contactfollowedby = $1
             AND DATE_TRUNC('month', createon) = DATE_TRUNC('month', CURRENT_DATE)`, [employeeId]
        );
        return parseInt(rows[0].count) || 0;
    }

    async getConvertedLeadsCount(employeeId) {
        const { rows } = await pool.query(
            `SELECT COUNT(*) as count FROM customers 
             WHERE leadfollowedby = $1
             AND DATE_TRUNC('month', createdon) = DATE_TRUNC('month', CURRENT_DATE)`, [employeeId]
        );
        return parseInt(rows[0].count) || 0;
    }

    async getLoginsCount(employeeId) {
        const { rows } = await pool.query(
            `SELECT COUNT(DISTINCT c.id) as count 
             FROM customers c
             JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
             WHERE c.leadfollowedby = $1 
             AND (c.status IN ('13', '15', '17', '18') 
                  OR c.status ILIKE 'filelogin' OR c.status ILIKE 'sanction' OR c.status ILIKE 'disbursement' OR c.status ILIKE 'completed')
             AND DATE_TRUNC('month', ltd.modifyon) = DATE_TRUNC('month', CURRENT_DATE)
             AND ltd.id = (SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid)`, [employeeId]
        );
        return parseInt(rows[0].count) || 0;
    }

    async getSanctionsCount(employeeId) {
        const { rows } = await pool.query(
            `SELECT COUNT(DISTINCT c.id) as count 
             FROM customers c
             JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
             WHERE c.leadfollowedby = $1 
             AND (c.status IN ('15', '17', '18')
                  OR c.status ILIKE 'sanction' OR c.status ILIKE 'disbursement' OR c.status ILIKE 'completed')
             AND DATE_TRUNC('month', ltd.modifyon) = DATE_TRUNC('month', CURRENT_DATE)
             AND ltd.id = (SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid)`, [employeeId]
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

    async getRevenueAchievement(employeeId) {
        const { rows } = await pool.query(
            `SELECT COALESCE(SUM(
                CASE
                    -- PL Logic
                    WHEN LOWER(c.product) ILIKE '%personal loan%' OR LOWER(c.product) = 'pl' THEN
                        CASE 
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.02
                            ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.01 
                        END
                    -- BL Logic
                    WHEN LOWER(c.product) ILIKE '%business loan%' OR LOWER(c.product) = 'bl' THEN
                        CASE 
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.02
                            ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.01 
                        END
                    -- HL Logic
                    WHEN LOWER(c.product) ILIKE '%home loan%' OR LOWER(c.product) = 'hl' THEN
                        CASE 
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.005
                            ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.003 
                        END
                    -- LAP Logic
                    WHEN LOWER(c.product) ILIKE '%loan against property%' OR LOWER(c.product) = 'lap' THEN
                        CASE
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.007
                            ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.004
                        END
                    ELSE 0
                END
            ), 0) as total
            FROM customers c
            JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
            JOIN leadpersonaldetails lp ON lp.id = c.leadid
            WHERE c.leadfollowedby = $1
            AND (c.status::text IN ('17', '18', 'Disbursed') 
                OR c.status::text ILIKE 'disbursement' OR c.status::text ILIKE 'completed')
            AND DATE_TRUNC('month', ltd.modifyon) = DATE_TRUNC('month', CURRENT_DATE)
            AND ltd.id = (SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid)`,
            [employeeId]
        );
        return parseFloat(rows[0].total) || 0;
    }

    async getRevenueBreakdown(employeeId) {
        const { rows } = await pool.query(
            `SELECT 
                c.product,
                c.name as customer_name,
                lp.contacttype,
                CAST(ltd.desireloanamount AS NUMERIC) as disbursement_amount,
                CASE
                    -- PL Logic
                    WHEN LOWER(c.product) ILIKE '%personal loan%' OR LOWER(c.product) = 'pl' THEN
                        CASE 
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN 2.0
                            ELSE 1.0
                        END
                    -- BL Logic
                    WHEN LOWER(c.product) ILIKE '%business loan%' OR LOWER(c.product) = 'bl' THEN
                        CASE 
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN 2.0
                            ELSE 1.0
                        END
                    -- HL Logic
                    WHEN LOWER(c.product) ILIKE '%home loan%' OR LOWER(c.product) = 'hl' THEN
                        CASE 
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN 0.5
                            ELSE 0.3
                        END
                    -- LAP Logic
                    WHEN LOWER(c.product) ILIKE '%loan against property%' OR LOWER(c.product) = 'lap' THEN
                        CASE
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN 0.7
                            ELSE 0.4
                        END
                    ELSE 0
                END as percentage,
                CASE
                    -- PL Logic
                    WHEN LOWER(c.product) ILIKE '%personal loan%' OR LOWER(c.product) = 'pl' THEN
                        CASE 
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.02
                            ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.01 
                        END
                    -- BL Logic
                    WHEN LOWER(c.product) ILIKE '%business loan%' OR LOWER(c.product) = 'bl' THEN
                        CASE 
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.02
                            ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.01 
                        END
                    -- HL Logic
                    WHEN LOWER(c.product) ILIKE '%home loan%' OR LOWER(c.product) = 'hl' THEN
                        CASE 
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.005
                            ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.003 
                        END
                    -- LAP Logic
                    WHEN LOWER(c.product) ILIKE '%loan against property%' OR LOWER(c.product) = 'lap' THEN
                        CASE
                            WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.007
                            ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.004
                        END
                    ELSE 0
                END as revenue_amount
            FROM customers c
            JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
            JOIN leadpersonaldetails lp ON lp.id = c.leadid
            WHERE c.leadfollowedby = $1
            AND (c.status::text IN ('17', '18', 'Disbursed') 
                OR c.status::text ILIKE 'disbursement' OR c.status::text ILIKE 'completed')
            AND ltd.id = (SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid)
            ORDER BY c.id DESC`,
            [employeeId]
        );
        return rows;
    }

    async updateTargetMetrics(id, data) {
        const { logins, sanctions, disbursement_volume, attended_calls_target, converted_leads, revenue_target, revenue_achievement } = data;
        const { rows } = await pool.query(
            `INSERT INTO targetmetrics (employee_id, logins, sanctions, disbursement_volume, attended_calls_target, converted_leads, revenue_target, revenue_achievement, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT ON CONSTRAINT targetmetrics_employee_id_key DO UPDATE SET
         logins = COALESCE($2, targetmetrics.logins),
         sanctions = COALESCE($3, targetmetrics.sanctions),
         disbursement_volume = COALESCE($4, targetmetrics.disbursement_volume),
         attended_calls_target = COALESCE($5, targetmetrics.attended_calls_target),
         converted_leads = COALESCE($6, targetmetrics.converted_leads),
         revenue_target = COALESCE($7, targetmetrics.revenue_target),
         revenue_achievement = COALESCE($8, targetmetrics.revenue_achievement),
         updated_at = NOW()
       RETURNING *`,
            [id, logins, sanctions, disbursement_volume, attended_calls_target, converted_leads, revenue_target, revenue_achievement]
        );
        return rows[0];
    }

    async getAssignedEmployees() {
        const { rows } = await pool.query(
            `SELECT e.id, e.name, e.designation, t.logins, t.sanctions, t.disbursement_volume, 
              t.attended_calls_target, t.converted_leads, t.revenue_target, t.revenue_achievement
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
