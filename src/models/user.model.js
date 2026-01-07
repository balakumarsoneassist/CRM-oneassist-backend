const pool = require('../db/index');

class UserModel {
    async findAll() {
        const { rows } = await pool.query('SELECT * FROM employeedetails ORDER BY id');
        return rows;
    }

    async findAssignees() {
        const { rows } = await pool.query('SELECT id,name,isactive FROM employeedetails ORDER BY id');
        return rows;
    }

    async findById(id) {
        const { rows } = await pool.query('SELECT * FROM employeedetails WHERE id = $1', [id]);
        return rows[0];
    }

    async findByEmail(email) {
        const { rows } = await pool.query('SELECT * FROM employeedetails WHERE emailid=$1 and isactive=$2', [email, 'true']);
        return rows[0];
    }

    async create(data, hashedPassword) {
        const {
            name, qualification, dateofbirth, joindate, presentaddress, permanentaddress, emailid, designation, mobilenumber, contactperson, contactnumber, logintime, isactive, isadminrights, isleadrights, iscontactrights, iscibilrights, isicicirights, organizationid, dept, issplrights, isreassignrights, image_data
        } = data;

        const { rows } = await pool.query(
            `INSERT INTO employeedetails (
        name, qualification, dateofbirth, joindate, presentaddress, permanentaddress, emailid, designation, mobilenumber, contactperson, contactnumber, logintime, isactive, isadminrights, isleadrights, iscontactrights, iscibilrights, isicicirights, organizationid, dept, issplrights, isreassignrights, password, image_data
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
      ) RETURNING *`,
            [
                name, qualification, dateofbirth, joindate, presentaddress, permanentaddress, emailid, designation, mobilenumber, contactperson, contactnumber, logintime, isactive, isadminrights, isleadrights, iscontactrights, iscibilrights, isicicirights, organizationid, dept, issplrights, isreassignrights, hashedPassword, image_data
            ]
        );
        return rows[0];
    }

    async update(id, data) {
        const {
            name, qualification, dateofbirth, joindate, presentaddress, permanentaddress, emailid, designation, mobilenumber, contactperson, contactnumber, logintime, isactive, isadminrights, isleadrights, iscontactrights, iscibilrights, isicicirights, organizationid, dept, issplrights, isreassignrights, image_data
        } = data;

        const { rows } = await pool.query(
            `UPDATE employeedetails SET
        name = COALESCE($1, name),
        qualification = COALESCE($2, qualification),
        dateofbirth = COALESCE($3, dateofbirth),
        joindate = COALESCE($4, joindate),
        presentaddress = COALESCE($5, presentaddress),
        permanentaddress = COALESCE($6, permanentaddress),
        emailid = COALESCE($7, emailid),
        designation = COALESCE($8, designation),
        mobilenumber = COALESCE($9, mobilenumber),
        contactperson = COALESCE($10, contactperson),
        contactnumber = COALESCE($11, contactnumber),
        logintime = COALESCE($12, logintime),
        isactive = COALESCE($13, isactive),
        isadminrights = COALESCE($14, isadminrights),
        isleadrights = COALESCE($15, isleadrights),
        iscontactrights = COALESCE($16, iscontactrights),
        iscibilrights = COALESCE($17, iscibilrights),
        isicicirights = COALESCE($18, isicicirights),
        organizationid = COALESCE($19, organizationid),
        dept = COALESCE($20, dept),
        issplrights = COALESCE($21, issplrights),
        isreassignrights = COALESCE($22, isreassignrights),
        image_data = COALESCE($23, image_data)
      WHERE id=$24 RETURNING *`,
            [
                name, qualification, dateofbirth, joindate, presentaddress, permanentaddress, emailid, designation, mobilenumber, contactperson, contactnumber, logintime, isactive, isadminrights, isleadrights, iscontactrights, iscibilrights, isicicirights, organizationid, dept, issplrights, isreassignrights, image_data, id
            ]
        );
        return rows[0];
    }

    async updatePassword(id, hashedPassword) {
        const { rows } = await pool.query('UPDATE employeedetails SET password = $1 WHERE id = $2 RETURNING id, name, emailid', [hashedPassword, id]);
        return rows[0];
    }
}

module.exports = new UserModel();
