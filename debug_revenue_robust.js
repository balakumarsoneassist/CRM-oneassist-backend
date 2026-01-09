const pool = require("./src/db/index");

async function debugData() {
    try {
        console.log("--- Debugging Revenue Data ---");
        // Get employee ID first (Limit 1 active employee who has disbursed customers?)
        // Or just query all disbursed customers.
        const { rows } = await pool.query(`
            SELECT 
                c.id as customer_id, 
                c.name, 
                c.product, 
                c.status,
                c.leadfollowedby,
                lp.id as lead_id,
                lp.contacttype, 
                ltd.desireloanamount
            FROM customers c
            LEFT JOIN leadpersonaldetails lp ON lp.id = c.leadid
            LEFT JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
            WHERE c.status::text IN ('17', '18', 'Disbursed') 
               OR c.status::text ILIKE 'disbursement' 
               OR c.status::text ILIKE 'completed'
            LIMIT 50
        `);

        console.log("Found rows:", rows.length);
        rows.forEach(r => {
            console.log("Row:", JSON.stringify(r));
        });

    } catch (e) {
        console.error("Query Error:", e);
    } finally {
        pool.end();
    }
}

debugData();
