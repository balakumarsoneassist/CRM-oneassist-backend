const pool = require("../db/pool");

class SearchModel {
    async searchLoanRegister(searchTerm) {
        const query = `SELECT CONCAT(firstname, ' ', lastname) AS name, NULL AS bankname, NULL AS loantype, NULL AS loanamount, NULL AS companycategory, NULL AS customersegment, 'loanregisterdetails' AS source FROM loanregisterdetails WHERE (firstname ILIKE $1 OR lastname ILIKE $1)`;
        const { rows } = await pool.query(query, [searchTerm]);
        return rows;
    }

    async searchLeadTrack(searchTerm, conditions, params) {
        const query = `SELECT customername AS name, bankname, loantype, NULL AS loanamount, compcat AS companycategory, custsegment AS customersegment, 'leadtrackdetails' AS source FROM leadtrackdetails WHERE (customername ILIKE $1 OR bankname ILIKE $1 OR loantype ILIKE $1 OR compcat ILIKE $1 OR custsegment ILIKE $1) ${conditions}`;
        const { rows } = await pool.query(query, params);
        return rows;
    }

    async searchCustomers(searchTerm, conditions, params) {
        const query = `SELECT name, bank AS bankname, product AS loantype, disbursedvalue AS loanamount, NULL AS companycategory, NULL AS customersegment, 'customers' AS source FROM customers WHERE (name ILIKE $1 OR bank ILIKE $1) ${conditions}`;
        const { rows } = await pool.query(query, params);
        return rows;
    }
}

module.exports = new SearchModel();
