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
        const { search, limit, offset, designation, sortBy, sortOrder } = params;
        const validSortColumns = ['name', 'designation', 'logins', 'sanctions', 'disbursement_volume', 'converted_leads', 'attended_calls', 'revenue_achievement'];
        let sortCol = validSortColumns.includes(sortBy) ? sortBy : 'name';
        const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

        // METRICS COLUMNS requiring potentially heavy calculation for sorting
        const metricColumns = ['logins', 'sanctions', 'disbursement_volume', 'converted_leads', 'attended_calls', 'revenue_achievement'];
        const isMetricSort = metricColumns.includes(sortCol);

        // ---------------------------------------------------------
        // STRATEGY 1: FAST PATH (Sort by Name/Designation)
        // ---------------------------------------------------------
        // 1. Fetch just the Paginated IDs first (Fast)
        // 2. Fetch Metrics ONLY for those specific IDs (Heavy but small batch)
        if (!isMetricSort) {
            // A. Fetch Base Data (IDs)
            let baseQuery = `SELECT e.id, e.name, e.designation, e.image_data, e.isactive, e.isadminrights FROM employeedetails e WHERE e.isactive = true AND e.isadminrights = false`;
            let baseValues = [];
            let pIdx = 1;

            if (search) {
                baseQuery += ` AND e.name ILIKE $${pIdx}`;
                baseValues.push(`%${search}%`);
                pIdx++;
            }
            if (designation) {
                baseQuery += ` AND e.designation = $${pIdx}`;
                baseValues.push(designation);
                pIdx++;
            }

            baseQuery += ` ORDER BY e.${sortCol} ${order} LIMIT $${pIdx} OFFSET $${pIdx + 1}`;
            baseValues.push(limit, offset);

            const { rows: employees } = await pool.query(baseQuery, baseValues);

            if (employees.length === 0) return [];

            // B. Fetch Metrics for these IDs
            const empIds = employees.map(e => e.id);
            const metricsQuery = `
                SELECT 
                    e.id, 
                    -- Logins Actual
                    (SELECT COUNT(*) FROM customers c 
                        WHERE c.leadfollowedby = e.id 
                        AND (c.status IN ('13', '15', '17', '18') OR c.status ILIKE 'filelogin' OR c.status ILIKE 'sanction' OR c.status ILIKE 'disbursement' OR c.status ILIKE 'completed')
                    ) as logins,
                    -- Sanctions Actual
                    (SELECT COUNT(*) FROM customers c 
                        WHERE c.leadfollowedby = e.id 
                        AND (c.status IN ('15', '17', '18') OR c.status ILIKE 'sanction' OR c.status ILIKE 'disbursement' OR c.status ILIKE 'completed')
                    ) as sanctions,
                    -- Disbursement Actual (Sum)
                    COALESCE((
                        SELECT SUM(CAST(ltd.desireloanamount AS NUMERIC))
                        FROM customers c
                        JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
                        WHERE c.leadfollowedby = e.id
                        AND (c.status::text IN ('17', '18', 'Disbursed') OR c.status::text ILIKE 'disbursement' OR c.status::text ILIKE 'completed')
                        AND ltd.id = (SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid)
                    ), 0) as disbursement_volume,
                    -- Converted Leads Actual
                    (SELECT COUNT(*) FROM customers c WHERE c.leadfollowedby = e.id) as converted_leads,
                    -- Attended Calls Actual
                    (SELECT COUNT(*) FROM leadtrackhistorydetails lth WHERE lth.contactfollowedby = e.id) as attended_calls,
                        COALESCE((
        SELECT SUM(
            CAST(ltd.disbursementamount AS NUMERIC)
            *
            (
                CASE
                    WHEN LOWER(lp.contacttype) IN (
                        'connector','qr','connector contact','qr contact'
                    )
                    THEN COALESCE(pwr.connector_percent, 0)
                    ELSE COALESCE(pwr.self_percent, 0)
                END
            ) / 100
        )
        FROM customers c
        JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
        JOIN leadpersonaldetails lp ON lp.id = c.leadid
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
        WHERE c.leadfollowedby = e.id
        AND (
            c.status::text IN ('17','18','Disbursed')
            OR c.status::text ILIKE 'disbursement'
            OR c.status::text ILIKE 'completed'
        )
        AND ltd.id = (
            SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid
        )
    ), 0) AS revenue_achievement,
                    -- Targets (Joined)
                    COALESCE(tm.logins, 0) as logins_target,
                    COALESCE(tm.sanctions, 0) as sanctions_target,
                    COALESCE(tm.disbursement_volume, 0) as disbursement_target,
                    COALESCE(tm.converted_leads, 0) as converted_target,
                    COALESCE(tm.attended_calls_target, 0) as attended_calls_target,
                    COALESCE(tm.revenue_target, 0) as revenue_target
                FROM employeedetails e
                LEFT JOIN targetmetrics tm ON e.id = tm.employee_id
                WHERE e.id = ANY($1)
            `;

            const { rows: metrics } = await pool.query(metricsQuery, [empIds]);

            // C. Merge Metrics into Employee Objects
            return employees.map(emp => {
                const metric = metrics.find(m => m.id === emp.id) || {};
                return { ...emp, ...metric }; // Merge everything
            });

        }

        // ---------------------------------------------------------
        // STRATEGY 2: SLOW PATH (Sort by Metric)
        // ---------------------------------------------------------
        // Must calculate all rows to sort correctly.
        // This remains the original heavy query logic.
        else {
            // OPTIMIZED QUERY: Filters apply directly to base table 'e' BEFORE complex subqueries run.
            let query = `
                SELECT 
                    e.id, 
                    e.name, 
                    e.designation, 
                    e.image_data, 
                    e.isactive,
                    e.isadminrights,
                    -- Logins Actual
                    (SELECT COUNT(*) FROM customers c 
                        WHERE c.leadfollowedby = e.id 
                        AND (c.status IN ('13', '15', '17', '18') OR c.status ILIKE 'filelogin' OR c.status ILIKE 'sanction' OR c.status ILIKE 'disbursement' OR c.status ILIKE 'completed')
                    ) as logins,
                    -- Sanctions Actual
                    (SELECT COUNT(*) FROM customers c 
                        WHERE c.leadfollowedby = e.id 
                        AND (c.status IN ('15', '17', '18') OR c.status ILIKE 'sanction' OR c.status ILIKE 'disbursement' OR c.status ILIKE 'completed')
                    ) as sanctions,
                    -- Disbursement Actual (Sum)
                    COALESCE((
                        SELECT SUM(CAST(ltd.desireloanamount AS NUMERIC))
                        FROM customers c
                        JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
                        WHERE c.leadfollowedby = e.id
                        AND (c.status::text IN ('17', '18', 'Disbursed') OR c.status::text ILIKE 'disbursement' OR c.status::text ILIKE 'completed')
                        AND ltd.id = (SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid)
                    ), 0) as disbursement_volume,
                    -- Converted Leads Actual
                    (SELECT COUNT(*) FROM customers c WHERE c.leadfollowedby = e.id) as converted_leads,
                    -- Attended Calls Actual
                    (SELECT COUNT(*) FROM leadtrackhistorydetails lth WHERE lth.contactfollowedby = e.id) as attended_calls,
                                      
      COALESCE((
        SELECT SUM(
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
        ),0) AS revenue_achievement,
                    -- Targets (Joined)
                    COALESCE(tm.logins, 0) as logins_target,
                    COALESCE(tm.sanctions, 0) as sanctions_target,
                    COALESCE(tm.disbursement_volume, 0) as disbursement_target,
                    COALESCE(tm.converted_leads, 0) as converted_target,
                    COALESCE(tm.attended_calls_target, 0) as attended_calls_target,
                    COALESCE(tm.revenue_target, 0) as revenue_target
                FROM employeedetails e
                LEFT JOIN targetmetrics tm ON e.id = tm.employee_id
                WHERE e.isactive = true
            `;

            let values = [];
            let paramIndex = 1;

            if (search) {
                query += ` AND e.name ILIKE $${paramIndex}`;
                values.push(`%${search}%`);
                paramIndex++;
            }

            if (designation) {
                query += ` AND e.designation = $${paramIndex}`;
                values.push(designation);
                paramIndex++;
            }

            // Apply Sorting
            query += ` ORDER BY ${sortCol} ${order}`;

            // Apply Pagination
            query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            values.push(limit, offset);

            const { rows } = await pool.query(query, values);
            return rows;
        }
    }

    async countAssignees(params) {
        const { search, designation } = params;

        let query = "SELECT COUNT(*) FROM employeedetails WHERE isactive = true";
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
