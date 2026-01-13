const pool = require("../db/index"); // single pool source

class SalesModel {
  /* =========================
   * SALES VISIT CUSTOMER
   * ========================= */

  // New style (object-based)
  async createCustomer(data) {
    const {
      name,
      mobileno,
      profession,
      designation,
      location,
      distance,
      notes,
      createdby,
      contactflag = false,
    } = data;

    const { rows } = await pool.query(
      `INSERT INTO salesvisitcustomers
            (name, mobileno, profession, designation, location, distance, notes, createdby, modifiedby, contactflag)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9)
            RETURNING id, *`,
      [
        name,
        mobileno,
        profession,
        designation,
        location,
        distance,
        notes,
        createdby,
        contactflag,
      ]
    );

    return rows[0];
  }

  // Upsert style (handles existing mobile numbers)
  async insertCustomer(params) {
    // params: [name, mobileno, profession, designation, location, distance, notes, createdby, contactflag]
    const { rows } = await pool.query(
      `INSERT INTO salesvisitcustomers
            (name, mobileno, profession, designation, location, distance, notes, createdby, modifiedby, contactflag)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
            ON CONFLICT (mobileno) 
            DO UPDATE SET 
                createdby = EXCLUDED.createdby,
                notes = EXCLUDED.notes,
                contactflag = EXCLUDED.contactflag,
                modifiedby = NOW()
            RETURNING id, *`,
      params
    );
    return rows[0];
  }

  /* =========================
   * SALES VISIT TRACK
   * ========================= */

  async createTrack(data) {
    const { custid, dateofvisit, nextvisit, remarks } = data;

    const { rows } = await pool.query(
      `INSERT INTO salesvisittrack
            (custid, dateofvisit, nextvisit, remarks, modifiedby)
            VALUES ($1,$2,$3,$4,NOW())
            RETURNING *`,
      [custid, dateofvisit, nextvisit, remarks]
    );

    return rows[0];
  }

  // Legacy alias
  async insertTrack(params) {
    const { rows } = await pool.query(
      `INSERT INTO salesvisittrack
            (custid, dateofvisit, nextvisit, remarks, modifiedby)
            VALUES ($1,$2,$3,$4,NOW())
            RETURNING *`,
      params
    );
    return rows[0];
  }

  /* =========================
   * FETCH METHODS
   * ========================= */

  async findCustomersByEmp(empid) {
    console.log("[SALES MODEL] findCustomersByEmp - querying for:", empid);

    // Ensure empid is a number or null
    const numericEmpId =
      empid && !isNaN(parseInt(empid)) ? parseInt(empid) : null;

    const { rows } = await pool.query(
      `SELECT 
                c.id, c.name, c.mobileno, c.profession, c.designation, 
                c.location, c.distance, c.notes, c.createdby, c.modifiedby, c.contactflag,
                COUNT(t.id) as novisit,
                MAX(t.dateofvisit) as lastvisit,
                STRING_AGG(DISTINCT t.remarks, ' | ') as all_remarks
             FROM salesvisitcustomers c
             LEFT JOIN salesvisittrack t ON c.id = t.custid
             WHERE (c.createdby = $1 OR c.createdby IS NULL)
               AND (c.contactflag = false OR c.contactflag IS NULL)
               AND c.name NOT ILIKE '%Test%'
             GROUP BY 
                c.id, c.name, c.mobileno, c.profession, c.designation, 
                c.location, c.distance, c.notes, c.createdby, c.modifiedby, c.contactflag
             ORDER BY MAX(t.dateofvisit) DESC NULLS LAST, c.id DESC`,
      [numericEmpId]
    );
    console.log(
      `[SALES MODEL] findCustomersByEmp - Result count: ${rows.length}`
    );
    return rows;
  }

  // Alias
  async selectCustomerList(empid) {
    return this.findCustomersByEmp(empid);
  }

  async findTrackByCust(custid) {
    const { rows } = await pool.query(
      `SELECT id, dateofvisit, nextvisit, remarks
             FROM salesvisittrack WHERE custid = $1`,
      [custid]
    );
    return rows;
  }

  // Alias
  async selectTrackByCustId(custid) {
    return this.findTrackByCust(custid);
  }

  /* =========================
   * UPDATE METHODS
   * ========================= */

  async updateCustomerFlag(id) {
    const { rows } = await pool.query(
      `UPDATE salesvisitcustomers
             SET contactflag = true, modifiedby = NOW()
             WHERE id = $1
             RETURNING *`,
      [parseInt(id)]
    );
    return rows[0];
  }

  /* =========================
   * REPORTS / COUNTS
   * ========================= */

  async getCustomerCount() {
    const { rows } = await pool.query(
      "SELECT * FROM SalesVisitCustomerCount()"
    );
    return rows;
  }

  // Alias
  async selectAllCustomersCount() {
    return this.getCustomerCount();
  }

  async findBasicCustomersByEmp(empid) {
    console.log("🔍 Executing findBasicCustomersByEmp for EmpID:", empid);

    // If empid is 'admin', we fetch ALL pending requests regardless of assignment
    const isAdmin = (empid === 'admin');
    const numericEmpId = !isAdmin && empid && !isNaN(parseInt(empid)) ? parseInt(empid) : null;

    let query = `
            SELECT 
                s.id, 
                s.name, 
                s.mobileno, 
                s.location, 
                s.contactflag, 
                (
                    SELECT t.appoinmentdate 
                    FROM leadpersonaldetails l 
                    JOIN leadtrackdetails t ON l.id = t.leadid 
                    WHERE TRIM(l.mobilenumber) = TRIM(s.mobileno)
                    AND t.isdirectmeet = true 
                    AND (t.approval_status IS NULL OR t.approval_status = 'Pending')
                    LIMIT 1
                ) as appoinment_date,
                (
                    SELECT t.tracknumber 
                    FROM leadpersonaldetails l 
                    JOIN leadtrackdetails t ON l.id = t.leadid 
                    WHERE TRIM(l.mobilenumber) = TRIM(s.mobileno)
                    AND t.isdirectmeet = true 
                    AND (t.approval_status IS NULL OR t.approval_status = 'Pending')
                    LIMIT 1
                ) as tracknumber,
                (SELECT MAX(dateofvisit) FROM salesvisittrack WHERE custid = s.id) as lastvisit,
                (SELECT COUNT(*) FROM salesvisittrack WHERE custid = s.id) as novisit,
                'customer' as record_type
            FROM salesvisitcustomers s
            WHERE s.contactflag = false
            ${!isAdmin ? 'AND s.createdby = $1::integer' : ''}

            UNION ALL

            SELECT 
                l.id, 
                (l.firstname || ' ' || COALESCE(l.lastname, '')) as name, 
                l.mobilenumber as mobileno, 
                l.presentaddress as location, 
                false as contactflag, 
                t.appoinmentdate as appoinment_date,
                t.tracknumber as tracknumber,
                (
                    SELECT MAX(st.dateofvisit) 
                    FROM salesvisittrack st 
                    JOIN salesvisitcustomers sc ON st.custid = sc.id 
                    WHERE TRIM(sc.mobileno) = TRIM(l.mobilenumber)
                ) as lastvisit,
                (
                    SELECT COUNT(*) 
                    FROM salesvisittrack st 
                    JOIN salesvisitcustomers sc ON st.custid = sc.id 
                    WHERE TRIM(sc.mobileno) = TRIM(l.mobilenumber)
                ) as novisit,
                'lead' as record_type
            FROM leadpersonaldetails l
            JOIN leadtrackdetails t ON l.id = t.leadid
            WHERE t.isdirectmeet = true 
            AND (t.approval_status IS NULL OR t.approval_status = 'Pending')
            AND TRIM(l.mobilenumber) NOT IN (SELECT TRIM(mobileno) FROM salesvisitcustomers WHERE contactflag = false ${!isAdmin ? 'AND createdby = $1::integer' : ''})
            ${!isAdmin ? 'AND t.contactfollowedby = $1::integer' : ''}
    `;

    const params = !isAdmin ? [numericEmpId] : [];

    // Add logic to exclude items that are already approved/rejected (handled by approval_status filter above)
    // Add logic to filter by employee if not admin (handled by contactfollowedby/createdby above)

    const { rows } = await pool.query(query, params);

    const nandha = rows.find(
      (r) => r.name && r.name.toLowerCase().includes("nandha")
    );
    if (nandha) {
      console.log("🔍 Debug Nandha Row:", JSON.stringify(nandha));
    }
    console.log("✅ findBasicCustomersByEmp result count:", rows.length);
    return rows;
  }

  // Alias
  async selectCustomersByEmp(empid) {
    return this.findBasicCustomersByEmp(empid);
  }
}

module.exports = new SalesModel();
