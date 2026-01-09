const pool = require("./src/db/index");

async function debugData() {
    try {
        console.log("--- Debugging Revenue Data ---");
        const { rows } = await pool.query(`
            SELECT 
                c.id, 
                c.name, 
                c.product, 
                c.status,
                c.leadfollowedby,
                lp.contacttype, 
                ltd.desireloanamount
            FROM customers c
            JOIN leadpersonaldetails lp ON lp.id = c.leadid
            LEFT JOIN leadtrackdetails ltd ON ltd.leadid = c.leadid
            WHERE c.status::text IN ('17', '18', 'Disbursed') 
               OR c.status::text ILIKE 'disbursement' 
               OR c.status::text ILIKE 'completed'
            LIMIT 10
        `);

        console.log("Found rows:", rows.length);
        rows.forEach(r => {
            console.log(JSON.stringify(r));
        });

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

debugData();
