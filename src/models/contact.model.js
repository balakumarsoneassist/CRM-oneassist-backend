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
    async selectAllAssignedContacts(orgid) {
        const { rows } = await pool.query('SELECT * FROM getallassignedcontactlist($1)', [orgid]);
        return rows;
    }
    async reassignAssignedContacts(leadid, newEmployeeId, orgid) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Update current assigned employee
            await client.query(
                `
    UPDATE leadtrackdetails ltd
    SET 
        contactfollowedby = $1,
        notes = 'Contact reassigned to ' || ed.name,
        modifyon = NOW()
    FROM employeedetails ed
    WHERE ed.id = $1
      AND ltd.leadid = $2
      AND ltd.organizationid = $3
    RETURNING ltd.leadid, ltd.notes;
    `,
                [newEmployeeId, leadid, orgid]
            );



            // 2. Insert reassignment into history
            await client.query(
                `
            INSERT INTO leadtrackhistorydetails
                (leadid, tracknumber, contactfollowedby, status, notes, createon)
            SELECT
                lt.leadid,
                lt.tracknumber,
                $1,
                lt.status,
                'Contact reassigned by admin',
                NOW()
            FROM leadtrackdetails lt
            WHERE lt.leadid = $2
            `,
                [newEmployeeId, leadid]
            );

            await client.query('COMMIT');
            return { success: true };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async selectTrackContacts(userid, orgid) {
        const { rows } = await pool.query('SELECT * FROM GetTrackContactList($1, $2)', [userid, orgid]);
        return rows;
    }
    async selectAllTrackedContacts(orgid) {
        const { rows } = await pool.query('SELECT * FROM getalltrackedcontactlist($1)', [orgid]);
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
