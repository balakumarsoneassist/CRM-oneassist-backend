const pool = require("../db/index"); // single pool source

class MasterModel {

    /* =========================
     * BRANCH MASTER
     * ========================= */

    // New style (object-based)
    async createBranch(data) {
        const { location, name, isactive } = data;
        const { rows } = await pool.query(
            `INSERT INTO branchmaster (location, name, isactive)
             VALUES ($1, $2, $3) RETURNING *`,
            [location, name, isactive]
        );
        return rows[0];
    }

    // Legacy support (params-based)
    async insertBranch(params) {
        const { rows } = await pool.query(
            `INSERT INTO branchmaster (location, name, isactive)
             VALUES ($1, $2, $3) RETURNING *`,
            params
        );
        return rows[0];
    }

    async updateBranch(idOrParams, data) {
        // Legacy style
        if (Array.isArray(idOrParams)) {
            const { rows } = await pool.query(
                `UPDATE branchmaster
                 SET location = COALESCE($1, location),
                     name = COALESCE($2, name),
                     isactive = COALESCE($3, isactive)
                 WHERE id = $4 RETURNING *`,
                idOrParams
            );
            return rows[0];
        }

        // New style
        const { location, name, isactive } = data;
        const { rows } = await pool.query(
            `UPDATE branchmaster
             SET location = COALESCE($1, location),
                 name = COALESCE($2, name),
                 isactive = COALESCE($3, isactive)
             WHERE id = $4 RETURNING *`,
            [
                location ?? null,
                name ?? null,
                typeof isactive !== "undefined" ? isactive : null,
                idOrParams
            ]
        );
        return rows[0];
    }

    async findBranches(whereClause = "", values = []) {
        const { rows } = await pool.query(
            `SELECT * FROM branchmaster ${whereClause} ORDER BY id DESC`,
            values
        );
        return rows;
    }

    // Legacy alias
    async selectBranches(query, values) {
        const { rows } = await pool.query(query, values);
        return rows;
    }

    /* =========================
     * LOCATION MASTER
     * ========================= */

    async createLocation(data) {
        const { location, state } = data;
        const { rows } = await pool.query(
            `INSERT INTO locationmaster (location, state)
             VALUES ($1, $2) RETURNING *`,
            [location, state]
        );
        return rows[0];
    }

    async insertLocation(params) {
        const { rows } = await pool.query(
            `INSERT INTO locationmaster (location, state)
             VALUES ($1, $2) RETURNING *`,
            params
        );
        return rows[0];
    }

    async updateLocation(idOrParams, data) {
        // Legacy
        if (Array.isArray(idOrParams)) {
            const { rows } = await pool.query(
                `UPDATE locationmaster
                 SET location = COALESCE($1, location),
                     state = COALESCE($2, state)
                 WHERE id = $3 RETURNING *`,
                idOrParams
            );
            return rows[0];
        }

        // New
        const { location, state } = data;
        const { rows } = await pool.query(
            `UPDATE locationmaster
             SET location = COALESCE($1, location),
                 state = COALESCE($2, state)
             WHERE id = $3 RETURNING *`,
            [location ?? null, state ?? null, idOrParams]
        );
        return rows[0];
    }

    async findLocations(whereClause = "", values = []) {
        const { rows } = await pool.query(
            `SELECT * FROM locationmaster ${whereClause} ORDER BY id DESC`,
            values
        );
        return rows;
    }

    // Legacy alias
    async selectLocations(query, values) {
        const { rows } = await pool.query(query, values);
        return rows;
    }

    /* =========================
     * BANK MASTER
     * ========================= */

    async insertBank(params) {
        const { rows } = await pool.query(
            `INSERT INTO bankmaster (bankname)
             VALUES ($1) RETURNING *`,
            params
        );
        return rows[0];
    }

    async updateBank(params) {
        const { rows } = await pool.query(
            `UPDATE bankmaster
             SET bankname = $1
             WHERE id = $2 RETURNING *`,
            params
        );
        return rows[0];
    }

    async selectBanks() {
        const { rows } = await pool.query(
            "SELECT * FROM bankmaster ORDER BY bankname ASC"
        );
        return rows;
    }

    async selectBankById(id) {
        const { rows } = await pool.query(
            "SELECT * FROM bankmaster WHERE id = $1",
            [id]
        );
        return rows[0];
    }

    /* =========================
     * LOAN MASTER
     * ========================= */

    async selectLoanList() {
        const { rows } = await pool.query("SELECT * FROM GetLoanList()");
        return rows;
    }

    /* =========================
    * REVENUE TARGET MASTER
    * ========================= */

    async updateProductRevenue(rows) {
        const client = await pool.connect();
        const query = `
    INSERT INTO productwiserevenuedetails
      (product_name, self_percent, connector_percent)
    VALUES ($1, $2, $3)
    ON CONFLICT (product_name)
    DO UPDATE SET
      self_percent = EXCLUDED.self_percent,
      connector_percent = EXCLUDED.connector_percent,
      updated_at = CURRENT_TIMESTAMP
  `;
        try {
            await client.query('BEGIN');

            for (const row of rows) {
                await client.query(query, [
                    row.productName,
                    row.selfPercent,
                    row.connectorPercent
                ]);
            }

            await client.query('COMMIT');
            return rows;

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;

        } finally {
            client.release();
        }
    }

    async getProductRevenue() {
        const { rows } = await pool.query(`
    SELECT
      LOWER(product_name) AS product,
      self_percent AS "selfPercent",
      connector_percent AS "connectorPercent"
    FROM productwiserevenuedetails
  `);

        return rows;
    }


    // Save multiple targets for an employee
    async saveTargets(employeeId, targets, totalRevenue) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // ✅ Get employee name from employeedetails table
            const empResult = await client.query(
                'SELECT name FROM employeedetails WHERE id = $1',
                [employeeId]
            );

            if (empResult.rows.length === 0) {
                throw new Error('Employee not found');
            }

            const employeeName = empResult.rows[0].name;

            // (Optional but recommended) Remove old targets
            await client.query(
                'DELETE FROM employeerevenuetarget WHERE employee_id = $1',
                [employeeId]
            );
            // Insert new targets
            if (!Array.isArray(targets)) {
                throw new Error('Targets must be an array');
            }

            const insertPromises = targets.map(t => {
                return pool.query(
                    `INSERT INTO employeerevenuetarget
             (employee_id, employee_name, business, volume, sourcing, payout_percent, revenue,total_revenue)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                    [
                        employeeId,
                        employeeName,
                        t.business,
                        t.volume,
                        t.sourcing,
                        t.payoutPercent,
                        t.revenue,
                        totalRevenue
                    ]
                );
            });

            await Promise.all(insertPromises);

            // await client.query(
            //     `
            // INSERT INTO targetmetrics (employee_id, revenue_target)
            // VALUES ($1, $2)
            // ON CONFLICT (employee_id)
            // DO UPDATE SET
            //     revenue_target = EXCLUDED.revenue_target,
            //     updated_at = CURRENT_TIMESTAMP
            // `,
            //     [employeeId, totalRevenue]
            // );
            await client.query('COMMIT');


            // 5. Return FULL RESPONSE
            return {
                employee_id: employeeId,
                employee_name: employeeName,
                targets,
                totalRevenue,
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }


    async getAllEmployeeTargets() {
        const { rows } = await pool.query(`
        SELECT DISTINCT employee_id, employee_name, total_revenue
        FROM employeerevenuetarget
        ORDER BY employee_name
    `)
        return rows
    }

    async getTargetsByEmployee(employeeId) {
        const query = `
        SELECT
            employee_id,
            employee_name,
            business,
            volume,
            sourcing,
            payout_percent AS "payoutPercent",
            revenue,
            total_revenue
        FROM employeerevenuetarget
        WHERE employee_id = $1
        ORDER BY id
    `;
        const { rows } = await pool.query(query, [employeeId]);
        return rows;
    };

    // Get targets for an employee
    async getEmployeeTargets(employeeId) {
        const detailQuery = `
      SELECT business, volume, sourcing, payout_percent AS "payoutPercent", revenue
      FROM employeerevenuetarget
      WHERE employee_id=$1
      ORDER BY id
    `;

        const summaryQuery = `
      SELECT employee_id, employee_name, total_revenue
      FROM employeerevenuesummary
      WHERE employee_id=$1
    `;

        const [details, summary] = await Promise.all([
            pool.query(detailQuery, [employeeId]),
            pool.query(summaryQuery, [employeeId])
        ]);

        if (!summary.rows.length) return null;

        return {
            employee_id: summary.rows[0].employee_id,
            employee_name: summary.rows[0].employee_name,
            targets: details.rows,
            total_revenue: summary.rows[0].total_revenue
        };
    }


    // Update a single target row
    async updateTarget(targetId, target) {
        const { business, volume, sourcing, payoutPercent, revenue } = target;

        await pool.query(
            `UPDATE employee_revenue_target SET
                business=$1,
                volume=$2,
                sourcing=$3,
                payout_percent=$4,
                revenue=$5,
                updated_at=NOW()
            WHERE id=$6`,
            [business, volume, sourcing, payoutPercent, revenue, targetId]
        );
    }

    // Delete a target row
    async deleteTargets(employeeId) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Delete all targets for the employee
            await client.query(
                'DELETE FROM employeerevenuetarget WHERE employee_id = $1',
                [employeeId]
            );

            await client.query(
                `UPDATE targetmetrics
             SET revenue_target = 0,
                 updated_at = CURRENT_TIMESTAMP
             WHERE employee_id = $1`,
                [employeeId]
            );


            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }

};

module.exports = new MasterModel();
