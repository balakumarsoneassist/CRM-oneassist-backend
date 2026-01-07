const pool = require('../db/index');

class ContactModel {
    async selectUnassignedContacts(orgid) {
        const { rows } = await pool.query('SELECT * FROM GetUnassignedContactList($1)', [orgid]);
        return rows;
    }

    async selectAssignedContacts(userid, orgid) {
        const { rows } = await pool.query('SELECT * FROM GetAssignedContactList($1, $2)', [userid, orgid]);
        return rows;
    }

    async selectTrackContacts(userid, orgid) {
        const { rows } = await pool.query('SELECT * FROM GetTrackContactList($1, $2)', [userid, orgid]);
        return rows;
    }

    async selectTrackLeads(userid, orgid) {
        const { rows } = await pool.query('SELECT * FROM GetTrackLeadList($1, $2)', [userid, orgid]);
        return rows;
    }

    async selectUnassignedLeads(orgid) {
        const { rows } = await pool.query('SELECT * FROM getunassignedleadlist($1)', [orgid]);
        return rows;
    }

    async selectAssignedLeads(userid, orgid) {
        const { rows } = await pool.query('SELECT * FROM getassignedleadlist($1, $2)', [userid, orgid]);
        return rows;
    }
}

module.exports = new ContactModel();
