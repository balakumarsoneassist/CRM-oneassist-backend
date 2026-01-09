const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/db/index');
const fs = require('fs');

async function checkSalesData() {
    try {
        const mobiles = ['8765455468', '8765454678'];
        console.log(`🔍 Checking Sales Customers for Mobiles: ${mobiles.join(', ')}`);

        // Check if they exist in salesvisitcustomers
        // We use LIKE to find potentially messy data
        const customers = await pool.query(`
            SELECT id, name, mobileno, createdby 
            FROM salesvisitcustomers 
            WHERE mobileno LIKE '%8765455468%' OR mobileno LIKE '%8765454678%'
        `);

        const output = {
            sales_customers: customers.rows.map(c => ({
                ...c,
                mobileno_length: c.mobileno.length,
                mobileno_quoted: `'${c.mobileno}'` // To see whitespace
            }))
        };

        fs.writeFileSync('debug_sales_result.json', JSON.stringify(output, null, 2));
        console.log('✅ Written to debug_sales_result.json');

    } catch (err) {
        console.error('❌ Error:', err);
        fs.writeFileSync('debug_sales_result.json', JSON.stringify({ error: err.message }));
    } finally {
        process.exit();
    }
}

checkSalesData();
