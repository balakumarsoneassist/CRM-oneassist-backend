require('dotenv').config();
const SalesService = require('./src/services/sales.service');
const pool = require('./src/db/index');

const fs = require('fs');

async function testSave() {
    try {
        const dummyData = {
            name: 'Test Customer 3',
            mobileno: '7777777777', // Unique number to trigger insert
            profession: 'Tester',
            designation: 'QA',
            location: 'Debug Land',
            distance: "", // Empty string to trigger integer error
            notes: 'Debug note',
            createdby: 1,
            contactflag: false,
            dateofvisit: new Date().toISOString(),
            nextvisit: new Date().toISOString(),
            remarks: 'Debug remarks'
        };

        const result = await SalesService.saveSalesVisit(dummyData);
        fs.writeFileSync('debug_output.txt', 'Success: ' + JSON.stringify(result, null, 2));
    } catch (err) {
        fs.writeFileSync('debug_output.txt', 'Error: ' + JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } finally {
        pool.end();
    }
}

testSave();
