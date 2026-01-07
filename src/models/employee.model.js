const pool = require("../db/index");

class EmployeeModel {
    async findAll() {
        const { rows } = await pool.query("SELECT * FROM employeedetails ORDER BY id");
        return rows;
    }

    async findAssignees() {
        const { rows } = await pool.query("SELECT id, name, isactive FROM employeedetails ORDER BY id");
        return rows;
    }

    async findById(id) {
        const { rows } = await pool.query("SELECT * FROM employeedetails WHERE id = $1", [id]);
        return rows[0];
    }

    async findByEmail(email) {
        const { rows } = await pool.query(
            "SELECT * FROM employeedetails WHERE emailid = $1 AND isactive = $2",
            [email, "true"]
        );
        return rows[0];
    }

    async findByIdAndActive(id) {
        const { rows } = await pool.query(
            "SELECT * FROM employeedetails WHERE id = $1 AND isactive = $2",
            [id, "true"]
        );
        return rows[0];
    }

    async create(data) {
        const {
            name, qualification, dateofbirth, joindate, presentaddress, permanentaddress,
            emailid, designation, mobilenumber, contactperson, contactnumber, logintime,
            isactive, isadminrights, isleadrights, iscontactrights, iscibilrights,
            isicicirights, organizationid, dept, issplrights, isreassignrights, password, image_data
        } = data;

        const { rows } = await pool.query(
            `INSERT INTO employeedetails (
        name, qualification, dateofbirth, joindate, presentaddress, permanentaddress, emailid, 
        designation, mobilenumber, contactperson, contactnumber, logintime, isactive, 
        isadminrights, isleadrights, iscontactrights, iscibilrights, isicicirights, 
        organizationid, dept, issplrights, isreassignrights, password, image_data
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
      ) RETURNING *`,
            [
                name, qualification, dateofbirth, joindate, presentaddress, permanentaddress,
                emailid, designation, mobilenumber, contactperson, contactnumber, logintime,
                isactive, isadminrights, isleadrights, iscontactrights, iscibilrights,
                isicicirights, organizationid, dept, issplrights, isreassignrights,
                password, image_data
            ]
        );
        return rows[0];
    }

    async update(id, data) {
        const fields = Object.keys(data);
        const updates = [];
        const values = [];

        fields.forEach((field, index) => {
            updates.push(`${field} = $${index + 1}`);
            values.push(data[field]);
        });

        values.push(id);
        const query = `UPDATE employeedetails SET ${updates.join(", ")} WHERE id = $${values.length} RETURNING *`;

        const { rows } = await pool.query(query, values);
        return rows[0];
    }

    async updatePassword(id, hashedPassword) {
        const { rows } = await pool.query(
            "UPDATE employeedetails SET password = $1 WHERE id = $2 RETURNING id, name, emailid",
            [hashedPassword, id]
        );
        return rows[0];
    }

    // Stored Procedure Wrappers
    async getDashboardUser(empid) {
        const { rows } = await pool.query("SELECT * FROM GetDashboarduser($1)", [empid]);
        return rows;
    }

    async getDashboardAdmin() {
        const { rows } = await pool.query("SELECT * FROM GetDashboardadmin()");
        return rows;
    }

    async getTodayAppointment(empid) {
        const { rows } = await pool.query("SELECT * FROM GetTodayAppoinment($1)", [empid]);
        return rows;
    }
}

module.exports = new EmployeeModel();
