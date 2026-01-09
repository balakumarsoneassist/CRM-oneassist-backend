const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/db/index');
const fs = require('fs');

async function dumpSales() {
    try {
        console.log('🔍 Dumping Sales Customers...');

        const customers = await pool.query(`
            SELECT id, name, mobileno, createdby 
            FROM salesvisitcustomers 
            LIMIT 50
        `);

        const output = {
            count: customers.rows.length,
            rows: customers.rows.map(c => ({
                ...c,
                mobileno_len: c.mobileno ? c.mobileno.length : 0,
                mobileno_quoted: c.mobileno ? `'${c.mobileno}'` : 'null'
            }))
        };

        fs.writeFileSync('debug_sales_dump.json', JSON.stringify(output, null, 2));
        console.log('✅ Written to debug_sales_dump.json');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        process.exit();
    }
}

dumpSales();
