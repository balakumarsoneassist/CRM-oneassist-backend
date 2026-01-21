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
        const { search, limit, offset, designation, sortBy, sortOrder, month, year, viewType } = params;
        const validSortColumns = ['name', 'designation', 'logins', 'sanctions', 'disbursement_volume', 'converted_leads', 'attended_calls', 'revenue_achievement'];
        let sortCol = validSortColumns.includes(sortBy) ? sortBy : 'name';
        const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

        // METRICS COLUMNS requiring potentially heavy calculation for sorting
        const metricColumns = ['logins', 'sanctions', 'disbursement_volume', 'converted_leads', 'attended_calls', 'revenue_achievement'];
        const isMetricSort = metricColumns.includes(sortCol);

        // --- DATE FILTER LOGIC ---
        let dateFilterLogins = "";
        let dateFilterSanctions = "";
        let dateFilterDisbursement = "";
        let dateFilterConverted = "";
        let dateFilterCalls = "";
        let dateFilterRevenue = "";

        if (year) {
            const timeFilter = viewType === 'monthly' && month
                ? `AND EXTRACT(MONTH FROM date_field) = ${month} AND EXTRACT(YEAR FROM date_field) = ${year}`
                : `AND EXTRACT(YEAR FROM date_field) = ${year}`;

            // Apply to specific tables/columns
            dateFilterLogins = timeFilter.split('date_field').join('ltd.modifyon');
            dateFilterSanctions = timeFilter.split('date_field').join('ltd.modifyon');
            dateFilterDisbursement = timeFilter.split('date_field').join('ltd.modifyon');
            dateFilterRevenue = timeFilter.split('date_field').join('ltd.modifyon');

            // Converted Leads uses createdon
            dateFilterConverted = timeFilter.split('date_field').join('c.createdon');

            // Calls uses createon
            dateFilterCalls = timeFilter.split('date_field').join('lth.createon');
        }


        // ---------------------------------------------------------
        // BASE QUERY BUILDER (Common for both strategies)
        // ---------------------------------------------------------
        // We define the subqueries dynamically based on filters

        const subQueryLogins = `
            (SELECT COUNT(DISTINCT c.id) FROM customers c 
             JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
             WHERE c.leadfollowedby = e.id 
             AND (c.status IN ('13', '15', '17', '18') OR c.status ILIKE 'filelogin' OR c.status ILIKE 'sanction' OR c.status ILIKE 'disbursement' OR c.status ILIKE 'completed')
             AND ltd.id = (SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid)
             ${dateFilterLogins}
            )`;

        const subQuerySanctions = `
            (SELECT COUNT(DISTINCT c.id) FROM customers c 
             JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
             WHERE c.leadfollowedby = e.id 
             AND (c.status IN ('15', '17', '18') OR c.status ILIKE 'sanction' OR c.status ILIKE 'disbursement' OR c.status ILIKE 'completed')
             AND ltd.id = (SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid)
             ${dateFilterSanctions}
            )`;

        const subQueryDisbursement = `
            COALESCE((
                SELECT SUM(CAST(ltd.desireloanamount AS NUMERIC))
                FROM customers c
                JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
                WHERE c.leadfollowedby = e.id
                AND (c.status::text IN ('17', '18', 'Disbursed') OR c.status::text ILIKE 'disbursement' OR c.status::text ILIKE 'completed')
                AND ltd.id = (SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid)
                ${dateFilterDisbursement}
            ), 0)`;

        const subQueryConverted = `(SELECT COUNT(*) FROM customers c WHERE c.leadfollowedby = e.id ${dateFilterConverted})`;

        const subQueryCalls = `(SELECT COUNT(*) FROM leadtrackhistorydetails lth WHERE lth.contactfollowedby = e.id ${dateFilterCalls})`;

        const subQueryRevenue = `
            COALESCE((
                SELECT SUM(
                    CASE
                        WHEN LOWER(c.product) ILIKE '%personal loan%' OR LOWER(c.product) = 'pl' THEN
                            CASE 
                                WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.02
                                ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.01 
                            END
                        WHEN LOWER(c.product) ILIKE '%business loan%' OR LOWER(c.product) = 'bl' THEN
                            CASE 
                                WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.02
                                ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.01 
                            END
                        WHEN LOWER(c.product) ILIKE '%home loan%' OR LOWER(c.product) = 'hl' THEN
                            CASE 
                                WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.005
                                ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.003 
                            END
                        WHEN LOWER(c.product) ILIKE '%loan against property%' OR LOWER(c.product) = 'lap' THEN
                            CASE
                                WHEN LOWER(lp.contacttype) IN ('self', 'website', 'normal contact', 'company contact') THEN CAST(ltd.desireloanamount AS NUMERIC) * 0.007
                                ELSE CAST(ltd.desireloanamount AS NUMERIC) * 0.004
                            END
                        ELSE 0
                    END
                )
                FROM customers c
                JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
                JOIN leadpersonaldetails lp ON lp.id = c.leadid
                WHERE c.leadfollowedby = e.id
                AND (c.status::text IN ('17', '18', 'Disbursed') OR c.status::text ILIKE 'disbursement' OR c.status::text ILIKE 'completed')
                AND ltd.id = (SELECT MAX(id) FROM leadtrackdetails WHERE leadid = c.leadid)
                ${dateFilterRevenue}
            ), 0)`;


        // ---------------------------------------------------------
        // STRATEGY 1: FAST PATH (Sort by Name/Designation)
        // ---------------------------------------------------------
        if (!isMetricSort) {
            let baseQuery = `SELECT e.id, e.name, e.designation, e.image_data, e.isactive FROM employeedetails e WHERE e.isactive = true`;
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
                    ${subQueryLogins} as logins,
                    ${subQuerySanctions} as sanctions,
                    ${subQueryDisbursement} as disbursement_volume,
                    ${subQueryConverted} as converted_leads,
                    ${subQueryCalls} as attended_calls,
                    -- Targets (Joined) - No date filter needed for targets generally, or should they scale? Leaving as static yearly targets usually.
                    COALESCE(tm.logins, 0) as logins_target,
                    COALESCE(tm.sanctions, 0) as sanctions_target,
                    COALESCE(tm.disbursement_volume, 0) as disbursement_target,
                    COALESCE(tm.converted_leads, 0) as converted_target,
                    COALESCE(tm.attended_calls_target, 0) as attended_calls_target,
                    COALESCE(tm.revenue_target, 0) as revenue_target,
                    ${subQueryRevenue} as revenue_achievement
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
        else {
            let query = `
                SELECT 
                    e.id, 
                    e.name, 
                    e.designation, 
                    e.image_data, 
                    e.isactive,
                    ${subQueryLogins} as logins,
                    ${subQuerySanctions} as sanctions,
                    ${subQueryDisbursement} as disbursement_volume,
                    ${subQueryConverted} as converted_leads,
                    ${subQueryCalls} as attended_calls,
                    COALESCE(tm.logins, 0) as logins_target,
                    COALESCE(tm.sanctions, 0) as sanctions_target,
                    COALESCE(tm.disbursement_volume, 0) as disbursement_target,
                    COALESCE(tm.converted_leads, 0) as converted_target,
                    COALESCE(tm.attended_calls_target, 0) as attended_calls_target,
                    COALESCE(tm.revenue_target, 0) as revenue_target,
                    ${subQueryRevenue} as revenue_achievement
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
