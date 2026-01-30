const { connectorLogin } = require("../controllers/connector.controller");
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

    async getRevenueAchievement(employeeId) {
        const client = await pool.connect();
        const { rows } = await client.query(
            `
    SELECT 
      COALESCE(
        SUM(
          CAST(ltd.disbursementamount AS NUMERIC)
          * (
              CASE
                WHEN LOWER(lp.contacttype) ILIKE '%connector%'
                  OR LOWER(lp.contacttype) ILIKE '%qr%'
                  THEN COALESCE(pwr.connector_percent, 0)
                ELSE COALESCE(pwr.self_percent, 0)
              END
            ) / 100
        ),
        0
      ) AS total
    FROM customers c
    JOIN leadtrackdetails ltd 
      ON ltd.leadid = c.leadid
    JOIN leadpersonaldetails lp 
      ON lp.id = c.leadid

    LEFT JOIN productwiserevenuedetails pwr
      ON LOWER(pwr.product_name) = LOWER(
        CASE
          -- PERSONAL LOAN
          WHEN c.product ILIKE '%personal%' OR c.product ILIKE 'pl%' 
            THEN 'pl'

          -- BUSINESS LOAN
          WHEN c.product ILIKE '%business%' OR c.product ILIKE 'bl%' 
            THEN 'bl'

          -- LAP
          WHEN c.product ILIKE '%lap%' 
            THEN 'lap'

          -- HOME LOAN
          WHEN c.product ILIKE '%home%'
            OR c.product ILIKE '%land%'
            OR c.product ILIKE '%lan%'
            THEN 'hl'
        END
      )

    WHERE c.leadfollowedby = $1
      AND (
        c.status::text IN ('17', '18', 'Disbursed')
        OR c.status::text ILIKE 'disbursement'
        OR c.status::text ILIKE 'completed'
      )
      AND ltd.id = (
        SELECT MAX(id)
        FROM leadtrackdetails
        WHERE leadid = c.leadid
        )
    `,
            [employeeId]
        );

        const revenueAchievement = Number(rows[0]?.total) || 0;

        await client.query(
            `
        UPDATE targetmetrics
        SET revenue_achievement = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = $2
        `,
            [revenueAchievement, employeeId]
        );

        return revenueAchievement;


    }




    async getRevenueBreakdown(employeeId) {
        const { rows } = await pool.query(
            `
    SELECT 
      c.product,
      c.name AS customer_name,
      lp.contacttype,
      CAST(ltd.disbursementamount AS NUMERIC) AS disbursement_amount,
      COALESCE(
        CASE
          WHEN LOWER(lp.contacttype) IN (
            'self', 'website', 'normal contact', 'company contact'
          )
          THEN pwr.self_percent

          WHEN LOWER(lp.contacttype) IN (
            'connector', 'qr', 'connector contact', 'qr contact'
          )
          THEN pwr.connector_percent

          ELSE 0
        END,
        0
      ) AS percentage,
      COALESCE(
        CAST(ltd.disbursementamount AS NUMERIC)
        * 
        (
          CASE
            WHEN LOWER(lp.contacttype) IN (
              'self', 'website', 'normal contact', 'company contact'
            )
            THEN pwr.self_percent

            WHEN LOWER(lp.contacttype) IN (
              'connector', 'qr', 'connector contact', 'qr contact'
            )
            THEN pwr.connector_percent

            ELSE 0
          END
        ) / 100,
        0
      ) AS revenue_amount

    FROM customers c
    JOIN leadtrackdetails ltd 
      ON ltd.leadid = c.leadid
    JOIN leadpersonaldetails lp 
      ON lp.id = c.leadid

    LEFT JOIN productwiserevenuedetails pwr
      ON LOWER(pwr.product_name) = LOWER(
        CASE
          WHEN c.product ILIKE '%personal%' OR c.product ILIKE 'pl%' THEN 'pl'
          WHEN c.product ILIKE '%business%' OR c.product ILIKE 'bl%' THEN 'bl'
          WHEN c.product ILIKE '%lap%' THEN 'lap'
          WHEN c.product ILIKE '%home%'
            OR c.product ILIKE '%land%'
            OR c.product ILIKE '%lan%' THEN 'hl'
        END
      )

    WHERE c.leadfollowedby = $1
      AND (
        c.status::text IN ('17', '18', 'Disbursed')
        OR c.status::text ILIKE 'disbursement'
        OR c.status::text ILIKE 'completed'
      )
      AND ltd.id = (
        SELECT MAX(id)
        FROM leadtrackdetails
        WHERE leadid = c.leadid
      )
    ORDER BY c.id DESC
    `,
            [employeeId]
        );

        return rows;
    }


    async updateTargetMetrics(id, data) {
        const { logins, sanctions, disbursement_volume, attended_calls_target, converted_leads, revenue_target } = data;
        const revenue_achievement = await this.getRevenueAchievement(id);
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
         revenue_achievement = $8,
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
