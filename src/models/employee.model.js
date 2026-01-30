const pool = require("../db/index");

class EmployeeModel {
    async findAll() {
        const { rows } = await pool.query("SELECT * FROM employeedetails ORDER BY id");
        return rows;
    }

    async findAssignees() {
        const { rows } = await pool.query("SELECT id, name, designation, image_data, isactive FROM employeedetails WHERE isactive = true ORDER BY id");
        return rows;
    }

    async findPaginatedAssignees(params) {
        const {
            search,
            limit,
            offset,
            designation,
            sortBy,
            sortOrder,
            fromDate,
            toDate
        } = params;

        const validSortColumns = [
            'name',
            'designation',
            'logins',
            'sanctions',
            'disbursement_volume',
            'converted_leads',
            'attended_calls',
            'revenue_achievement'
        ];

        const sortCol = validSortColumns.includes(sortBy) ? sortBy : 'name';
        const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

        const metricColumns = [
            'logins',
            'sanctions',
            'disbursement_volume',
            'converted_leads',
            'attended_calls',
            'revenue_achievement'
        ];

        const isMetricSort = metricColumns.includes(sortCol);

        /* =====================================================
           FAST PATH – sort by name / designation
        ===================================================== */
        if (!isMetricSort) {

            /* -------- 1️⃣ Base Employees -------- */
            let baseQuery = `
      SELECT e.id, e.name, e.designation, e.image_data, e.isactive, e.isadminrights
      FROM employeedetails e
      WHERE e.isactive = true AND e.isadminrights = false
    `;

            const baseValues = [];
            let idx = 1;

            if (search) {
                baseQuery += ` AND e.name ILIKE $${idx}`;
                baseValues.push(`%${search}%`);
                idx++;
            }

            if (designation) {
                baseQuery += ` AND e.designation = $${idx}`;
                baseValues.push(designation);
                idx++;
            }

            baseQuery += ` ORDER BY e.${sortCol} ${order} LIMIT $${idx} OFFSET $${idx + 1}`;
            baseValues.push(limit, offset);

            const { rows: employees } = await pool.query(baseQuery, baseValues);
            if (!employees.length) return [];

            /* -------- 2️⃣ Metrics -------- */
            const empIds = employees.map(e => e.id);

            const metricsQuery = `
      SELECT e.id,

        /* LOGINS */
        (
          SELECT COUNT(*)
          FROM customers c
          WHERE c.leadfollowedby = e.id
            AND ($2::date IS NULL OR c.createdon >= $2::date)
            AND ($3::date IS NULL OR c.createdon < ($3::date + INTERVAL '1 day'))
            AND (c.status IN ('13','15','17','18') OR c.status ILIKE 'filelogin')
        ) AS logins,

        /* SANCTIONS */
        (
          SELECT COUNT(*)
          FROM customers c
          WHERE c.leadfollowedby = e.id
            AND ($2::date IS NULL OR c.createdon >= $2::date)
            AND ($3::date IS NULL OR c.createdon < ($3::date + INTERVAL '1 day'))
            AND (c.status IN ('15','17','18') OR c.status ILIKE 'sanction')
        ) AS sanctions,

        /* CONVERTED LEADS */
        (
          SELECT COUNT(*)
          FROM customers c
          WHERE c.leadfollowedby = e.id
            AND ($2::date IS NULL OR c.createdon >= $2::date)
            AND ($3::date IS NULL OR c.createdon < ($3::date + INTERVAL '1 day'))
        ) AS converted_leads,

        /* ATTENDED CALLS */
        (
          SELECT COUNT(*)
          FROM leadtrackhistorydetails lth
          WHERE lth.contactfollowedby = e.id
            AND ($2::date IS NULL OR lth.createon >= $2::date)
            AND ($3::date IS NULL OR lth.createon < ($3::date + INTERVAL '1 day'))
        ) AS attended_calls,

        /* REVENUE ACHIEVEMENT */
        (
          SELECT COALESCE(SUM(
            CAST(ltd.disbursementamount AS NUMERIC) *
            CASE
              WHEN LOWER(lp.contacttype) IN ('connector','qr','connector contact','qr contact')
                THEN COALESCE(pwr.connector_percent,0)
              ELSE COALESCE(pwr.self_percent,0)
            END / 100
          ),0)
          FROM customers c
          JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
          JOIN leadpersonaldetails lp ON lp.id = c.leadid
          LEFT JOIN productwiserevenuedetails pwr
            ON LOWER(pwr.product_name) = LOWER(
              CASE
                WHEN c.product ILIKE '%personal%' OR c.product ILIKE 'pl%' THEN 'pl'
                WHEN c.product ILIKE '%business%' OR c.product ILIKE 'bl%' THEN 'bl'
                WHEN c.product ILIKE '%lap%' THEN 'lap'
                WHEN c.product ILIKE '%home%' OR c.product ILIKE '%land%' OR c.product ILIKE '%lan%' THEN 'hl'
              END
            )
          WHERE c.leadfollowedby = e.id
            AND ($2::date IS NULL OR c.createdon >= $2::date)
            AND ($3::date IS NULL OR c.createdon < ($3::date + INTERVAL '1 day'))
            AND (
              c.status IN ('17','18','Disbursed')
              OR c.status ILIKE 'disbursement'
              OR c.status ILIKE 'completed'
            )
            AND ltd.id = (
              SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid
            )
        ) AS revenue_achievement,

        /* TARGETS */
        COALESCE(tm.logins,0) AS logins_target,
        COALESCE(tm.sanctions,0) AS sanctions_target,
        COALESCE(tm.disbursement_volume,0) AS disbursement_target,
        COALESCE(tm.converted_leads,0) AS converted_target,
        COALESCE(tm.attended_calls_target,0) AS attended_calls_target,
        COALESCE(tm.revenue_target,0) AS revenue_target

      FROM employeedetails e
      LEFT JOIN targetmetrics tm ON tm.employee_id = e.id
      WHERE e.id = ANY($1)
    `;

            const { rows: metrics } = await pool.query(metricsQuery, [
                empIds,
                fromDate || null,
                toDate || null
            ]);

            return employees.map(emp => ({
                ...emp,
                ...(metrics.find(m => m.id === emp.id) || {})
            }));
        }

        /* =====================================================
           SLOW PATH – sort by metric
        ===================================================== */
        let query = `
    SELECT *
    FROM (
      SELECT e.id, e.name, e.designation, e.image_data, e.isactive, e.isadminrights,

       (
          SELECT COUNT(*)
          FROM customers c
          WHERE c.leadfollowedby = e.id
            AND ($2::date IS NULL OR c.createdon >= $2::date)
            AND ($3::date IS NULL OR c.createdon < ($3::date + INTERVAL '1 day'))
            AND (c.status IN ('13','15','17','18') OR c.status ILIKE 'filelogin')
        ) AS logins,

        /* SANCTIONS */
        (
          SELECT COUNT(*)
          FROM customers c
          WHERE c.leadfollowedby = e.id
            AND ($2::date IS NULL OR c.createdon >= $2::date)
            AND ($3::date IS NULL OR c.createdon < ($3::date + INTERVAL '1 day'))
            AND (c.status IN ('15','17','18') OR c.status ILIKE 'sanction')
        ) AS sanctions,

        /* CONVERTED LEADS */
        (
          SELECT COUNT(*)
          FROM customers c
          WHERE c.leadfollowedby = e.id
            AND ($2::date IS NULL OR c.createdon >= $2::date)
            AND ($3::date IS NULL OR c.createdon < ($3::date + INTERVAL '1 day'))
        ) AS converted_leads,

        /* ATTENDED CALLS */
        (
          SELECT COUNT(*)
          FROM leadtrackhistorydetails lth
          WHERE lth.contactfollowedby = e.id
            AND ($2::date IS NULL OR lth.createon >= $2::date)
            AND ($3::date IS NULL OR lth.createon < ($3::date + INTERVAL '1 day'))
        ) AS attended_calls,

        /* REVENUE ACHIEVEMENT */
        (
          SELECT COALESCE(SUM(
            CAST(ltd.disbursementamount AS NUMERIC) *
            CASE
              WHEN LOWER(lp.contacttype) IN ('connector','qr','connector contact','qr contact')
                THEN COALESCE(pwr.connector_percent,0)
              ELSE COALESCE(pwr.self_percent,0)
            END / 100
          ),0)
          FROM customers c
          JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
          JOIN leadpersonaldetails lp ON lp.id = c.leadid
          LEFT JOIN productwiserevenuedetails pwr
            ON LOWER(pwr.product_name) = LOWER(
              CASE
                WHEN c.product ILIKE '%personal%' OR c.product ILIKE 'pl%' THEN 'pl'
                WHEN c.product ILIKE '%business%' OR c.product ILIKE 'bl%' THEN 'bl'
                WHEN c.product ILIKE '%lap%' THEN 'lap'
                WHEN c.product ILIKE '%home%' OR c.product ILIKE '%land%' OR c.product ILIKE '%lan%' THEN 'hl'
              END
            )
          WHERE c.leadfollowedby = e.id
            AND ($2::date IS NULL OR c.createdon >= $2::date)
            AND ($3::date IS NULL OR c.createdon < ($3::date + INTERVAL '1 day'))
            AND (
              c.status IN ('17','18','Disbursed')
              OR c.status ILIKE 'disbursement'
              OR c.status ILIKE 'completed'
            )
            AND ltd.id = (
              SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid
            )
        ) AS revenue_achievement,

        /* TARGETS */
        COALESCE(tm.logins,0) AS logins_target,
        COALESCE(tm.sanctions,0) AS sanctions_target,
        COALESCE(tm.disbursement_volume,0) AS disbursement_target,
        COALESCE(tm.converted_leads,0) AS converted_target,
        COALESCE(tm.attended_calls_target,0) AS attended_calls_target,
        COALESCE(tm.revenue_target,0) AS revenue_target


      FROM employeedetails e
      LEFT JOIN targetmetrics tm ON tm.employee_id = e.id
      WHERE e.isactive = true
    ) t
  `;

        const values = [];
        let idx = 1;

        if (search) {
            query += ` WHERE t.name ILIKE $${idx}`;
            values.push(`%${search}%`);
            idx++;
        }

        if (designation) {
            query += search ? ` AND` : ` WHERE`;
            query += ` t.designation = $${idx}`;
            values.push(designation);
            idx++;
        }

        query += ` ORDER BY ${sortCol} ${order} LIMIT $${idx} OFFSET $${idx + 1}`;
        values.push(limit, offset);

        const { rows } = await pool.query(query, values);
        return rows;
    }



    async countAssignees(params) {
        const { search, designation } = params;

        let query = "SELECT COUNT(*) FROM employeedetails WHERE isactive = true AND isadminrights = false";
        let values = [];
        let paramIndex = 1;

        if (search) {
            query += ` AND name ILIKE $${paramIndex}`;
            values.push(`%${search}%`);
            paramIndex++;
        }

        if (designation) {
            query += ` AND designation = $${paramIndex}`;
            values.push(designation);
            paramIndex++;
        }

        const { rows } = await pool.query(query, values);
        return parseInt(rows[0].count);
    }


    async findById(id) {
        const { rows } = await pool.query("SELECT * FROM employeedetails WHERE id = $1", [id]);
        return rows[0];
    }

    async findByEmail(email) {
        const { rows } = await pool.query(
            "SELECT * FROM employeedetails WHERE emailid = $1 AND isactive = $2",
            [email, "true"]
        );
        return rows[0];
    }

    async findByIdAndActive(id) {
        const { rows } = await pool.query(
            "SELECT * FROM employeedetails WHERE id = $1 AND isactive = $2",
            [id, "true"]
        );
        return rows[0];
    }

    async create(data) {
        const {
            name, qualification, dateofbirth, joindate, presentaddress, permanentaddress,
            emailid, designation, mobilenumber, contactperson, contactnumber, logintime,
            isactive, isadminrights, isleadrights, iscontactrights, iscibilrights,
            isicicirights, organizationid, dept, issplrights, isreassignrights, password, image_data
        } = data;

        const { rows } = await pool.query(
            `INSERT INTO employeedetails (
        name, qualification, dateofbirth, joindate, presentaddress, permanentaddress, emailid, 
        designation, mobilenumber, contactperson, contactnumber, logintime, isactive, 
        isadminrights, isleadrights, iscontactrights, iscibilrights, isicicirights, 
        organizationid, dept, issplrights, isreassignrights, password, image_data
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
      ) RETURNING *`,
            [
                name, qualification, dateofbirth, joindate, presentaddress, permanentaddress,
                emailid, designation, mobilenumber, contactperson, contactnumber, logintime,
                isactive, isadminrights, isleadrights, iscontactrights, iscibilrights,
                isicicirights, organizationid, dept, issplrights, isreassignrights,
                password, image_data
            ]
        );
        return rows[0];
    }

    async update(id, data) {
        const fields = Object.keys(data);
        const updates = [];
        const values = [];

        fields.forEach((field, index) => {
            updates.push(`${field} = $${index + 1}`);
            values.push(data[field]);
        });

        values.push(id);
        const query = `UPDATE employeedetails SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`;

        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    async updatePassword(id, hashedPassword) {
        const { rows } = await pool.query(
            "UPDATE employeedetails SET password = $1 WHERE id = $2 RETURNING id, name, emailid",
            [hashedPassword, id]
        );
        return rows[0];
    }

    // Stored Procedure Wrappers
    async getDashboardUser(empid) {
        const { rows } = await pool.query("SELECT * FROM GetDashboarduser($1)", [empid]);
        return rows;
    }

    async getDashboardAdmin() {
        const { rows } = await pool.query("SELECT * FROM GetDashboardadmin()");
        return rows;
    }

    async getTodayAppointment(empid) {
        const { rows } = await pool.query("SELECT * FROM GetTodayAppoinment($1)", [empid]);
        return rows;
    }
}

module.exports = new EmployeeModel();
