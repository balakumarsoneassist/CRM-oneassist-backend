const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const pool = require('./src/db/index');
const fs = require('fs');

async function checkData() {
    try {
        const mobiles = ['8765455468', '8765454678'];
        console.log(`🔍 Checking Mobile Numbers: ${mobiles.join(', ')}`);

        // Check if they exist in leadpersonaldetails
        const leads = await pool.query(`
            SELECT l.id, l.firstname, l.mobilenumber 
            FROM leadpersonaldetails l 
            WHERE l.mobilenumber = ANY($1)
        `, [mobiles]);

        console.log(`found ${leads.rows.length} leads`);

        const results = [];

        for (const lead of leads.rows) {
            // Check tracking details for each lead
            const track = await pool.query(`
                SELECT * FROM leadtrackdetails 
                WHERE leadid = $1
            `, [lead.id]);

            results.push({
                lead: lead,
                track: track.rows
            });
        }

        const output = {
            leads_found: results
        };

        fs.writeFileSync('debug_result.json', JSON.stringify(output, null, 2));
        console.log('✅ Written to debug_result.json');

    } catch (err) {
        console.error('❌ Error:', err);
        fs.writeFileSync('debug_result.json', JSON.stringify({ error: err.message }));
    } finally {
        process.exit();
    }
}

checkData();
