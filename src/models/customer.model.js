const pool = require("../db/index"); // use one pool consistently

class CustomerModel {
  /* =========================
   * CONTACT & LEAD LISTING
   * ========================= */

  async getUnassignedContacts(orgid) {
    const { rows } = await pool.query(
      "SELECT * FROM GetUnassignedContactList($1)",
      [orgid]
    );
    return rows;
  }

  async getAssignedContacts(userid, orgid) {
    const { rows } = await pool.query(
      "SELECT * FROM GetAssignedContactList($1, $2)",
      [userid, orgid]
    );
    return rows;
  }

  async getTrackContacts(userid, orgid) {
    const { rows } = await pool.query(
      "SELECT * FROM GetTrackContactList($1, $2)",
      [userid, orgid]
    );
    return rows;
  }

  async getTrackLeads(userid, orgid) {
    const { rows } = await pool.query(
      "SELECT * FROM GetTrackLeadList($1, $2)",
      [userid, orgid]
    );
    return rows;
  }

  async getUnassignedLeads(orgid) {
    const { rows } = await pool.query(
      "SELECT * FROM getunassignedleadlist($1)",
      [orgid]
    );
    return rows;
  }

  async getAssignedLeads(userid, orgid) {
    const { rows } = await pool.query(
      "SELECT * FROM getassignedleadlist($1, $2)",
      [userid, orgid]
    );
    return rows;
  }

  /* =========================
   * CUSTOMER
   * ========================= */

  // Object-based (preferred)
  async create(data) {
    const {
      name,
      loandate,
      location,
      mobilenumber,
      product,
      email,
      status,
      bank,
      disbursedvalue,
      profile,
      remarks,
      notes,
      newstatus,
      leadid,
      leadfollowedby,
    } = data;

    const { rows } = await pool.query(
      `INSERT INTO customers (
                name, loandate, location, mobilenumber, product, email, status, bank,
                disbursedvalue, profile, remarks, notes, newstatus, leadid, leadfollowedby, createdon
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
            RETURNING *`,
      [
        name,
        loandate,
        location,
        mobilenumber,
        product,
        email,
        status,
        bank,
        disbursedvalue,
        profile,
        remarks,
        notes,
        newstatus,
        leadid,
        leadfollowedby,
      ]
    );

    return rows[0];
  }

  // Params-based (legacy support)
  async insertCustomer(params) {
    const { rows } = await pool.query(
      `INSERT INTO customers (
                name, loandate, location, mobilenumber, product, email, status, bank,
                disbursedvalue, profile, remarks, notes, newstatus, leadid, leadfollowedby, createdon
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
            RETURNING *`,
      params
    );
    return rows[0];
  }

  async getCustomerList(followedBy = null) {
    let query = `
            SELECT 
                c.id, 
                c.name, 
                c.bank as bank, 
                c.product as product, 
                c.disbursedvalue as loanamount, 
                COALESCE(ltd.compcat, '') as companycategory, 
                COALESCE(ltd.custsegment, '') as customersegment,
                c.mobilenumber,
                c.email,
                c.createdon,
                ltd.isdirectmeet,
                ltd.appoinmentdate
            FROM customers c
            LEFT JOIN leadtrackdetails ltd ON c.leadid = ltd.leadid
        `;
    const values = [];
    if (followedBy) {
      query += ` WHERE c.leadfollowedby::text = $1::text`;
      values.push(followedBy);
    }
    query += ` ORDER BY c.createdon DESC`;
    const { rows } = await pool.query(query, values);
    return rows;
  }

  // Alias for backward compatibility
  async selectCustomerList() {
    return this.getCustomerList();
  }

  async getCustomerByLeadId(leadid) {
    const { rows } = await pool.query(
      "SELECT * FROM customers WHERE leadid = $1",
      [leadid]
    );
    return rows[0];
  }

  async reassignToContact(customerId) {
    const { rows: custRows } = await pool.query(
      "SELECT c.leadid, ltd.organizationid FROM customers c LEFT JOIN leadtrackdetails ltd ON c.leadid = ltd.leadid WHERE c.id = $1",
      [customerId]
    );

    if (custRows.length === 0) return null;
    const { leadid, organizationid } = custRows[0];

    if (!leadid) return null;

    // 1. Unlink from customers but keep record for history
    await pool.query(
      "UPDATE customers SET leadid = NULL, notes = CONCAT(COALESCE(notes, ''), ' [Reassigned to Unassigned at ', NOW()::text, ']') WHERE id = $1",
      [customerId]
    );

    // 2. Remove active tracking
    await pool.query("DELETE FROM leadtrackdetails WHERE leadid = $1", [
      leadid,
    ]);

    // 3. Reset lead details to 'New' and 'Contact' type
    await pool.query(
      `UPDATE leadpersonaldetails 
             SET status = 1, 
                 contacttype = 'Contact', 
                 type = 'Contact',
                 createdon = NOW(),
                 organizationid = COALESCE($2, organizationid)
             WHERE id = $1`,
      [leadid, organizationid]
    );

    return { leadid, customerId };
  }

  async getAllCustomers(filters) {
    const {
      search,
      segments,
      categories,
      banks,
      loanTypes,
      minAmount,
      maxAmount,
      page,
      limit,
      followedBy,
    } = filters;
    const offset = (page - 1) * limit;

    let query = `SELECT 
            c.id, 
            c.name, 
            c.bank as bankname, 
            c.product as loantype, 
            c.disbursedvalue as loanamount, 
            COALESCE(ltd.compcat, '') as companycategory, 
            COALESCE(ltd.custsegment, '') as customersegment,
            c.mobilenumber,
            c.email,
            c.createdon
        FROM customers c
        LEFT JOIN leadtrackdetails ltd ON c.leadid = ltd.leadid
        WHERE 1=1`;
    const values = [];
    let placeholderIdx = 1;

    if (search) {
      query += ` AND (name ILIKE $${placeholderIdx} OR mobilenumber ILIKE $${placeholderIdx} OR email ILIKE $${placeholderIdx})`;
      values.push(`%${search}%`);
      placeholderIdx++;
    }

    if (segments && segments.length) {
      query += ` AND ltd.custsegment = ANY($${placeholderIdx})`;
      values.push(segments);
      placeholderIdx++;
    }

    if (categories && categories.length) {
      query += ` AND ltd.compcat = ANY($${placeholderIdx})`;
      values.push(categories);
      placeholderIdx++;
    }

    if (banks && banks.length) {
      query += ` AND c.bank = ANY($${placeholderIdx})`;
      values.push(banks);
      placeholderIdx++;
    }

    if (loanTypes && loanTypes.length) {
      query += ` AND c.product = ANY($${placeholderIdx})`;
      values.push(loanTypes);
      placeholderIdx++;
    }

    if (minAmount !== null) {
      query += ` AND CAST(NULLIF(c.disbursedvalue, '') AS NUMERIC) >= $${placeholderIdx}`;
      values.push(minAmount);
      placeholderIdx++;
    }

    if (maxAmount !== null) {
      query += ` AND CAST(NULLIF(c.disbursedvalue, '') AS NUMERIC) <= $${placeholderIdx}`;
      values.push(maxAmount);
      placeholderIdx++;
    }

    if (followedBy) {
      query += ` AND c.leadfollowedby::text = $${placeholderIdx}::text`;
      values.push(followedBy);
      placeholderIdx++;
    }

    query += ` ORDER BY c.createdon DESC LIMIT $${placeholderIdx} OFFSET $${
      placeholderIdx + 1
    }`;
    values.push(limit, offset);

    const { rows } = await pool.query(query, values);
    return rows;
  }

  async getAllCustomersCount(filters) {
    const {
      search,
      segments,
      categories,
      banks,
      loanTypes,
      minAmount,
      maxAmount,
      followedBy,
    } = filters;

    let query = `SELECT COUNT(*) 
        FROM customers c
        LEFT JOIN leadtrackdetails ltd ON c.leadid = ltd.leadid
        WHERE 1=1`;
    const values = [];
    let placeholderIdx = 1;

    if (search) {
      query += ` AND (name ILIKE $${placeholderIdx} OR mobilenumber ILIKE $${placeholderIdx} OR email ILIKE $${placeholderIdx})`;
      values.push(`%${search}%`);
      placeholderIdx++;
    }

    if (segments && segments.length) {
      query += ` AND ltd.custsegment = ANY($${placeholderIdx})`;
      values.push(segments);
      placeholderIdx++;
    }

    if (categories && categories.length) {
      query += ` AND ltd.compcat = ANY($${placeholderIdx})`;
      values.push(categories);
      placeholderIdx++;
    }

    if (banks && banks.length) {
      query += ` AND bank = ANY($${placeholderIdx})`;
      values.push(banks);
      placeholderIdx++;
    }

    if (loanTypes && loanTypes.length) {
      query += ` AND product = ANY($${placeholderIdx})`;
      values.push(loanTypes);
      placeholderIdx++;
    }

    if (minAmount !== null) {
      query += ` AND CAST(NULLIF(c.disbursedvalue, '') AS NUMERIC) >= $${placeholderIdx}`;
      values.push(minAmount);
      placeholderIdx++;
    }

    if (maxAmount !== null) {
      query += ` AND CAST(NULLIF(c.disbursedvalue, '') AS NUMERIC) <= $${placeholderIdx}`;
      values.push(maxAmount);
      placeholderIdx++;
    }

    if (followedBy) {
      query += ` AND c.leadfollowedby::text = $${placeholderIdx}::text`;
      values.push(followedBy);
      placeholderIdx++;
    }

    const { rows } = await pool.query(query, values);
    return parseInt(rows[0].count);
  }

  async getCustomerFilterOptions() {
    const segments = await pool.query(
      "SELECT DISTINCT custsegment FROM leadtrackdetails WHERE custsegment IS NOT NULL AND custsegment != ''"
    );
    const categories = await pool.query(
      "SELECT DISTINCT compcat FROM leadtrackdetails WHERE compcat IS NOT NULL AND compcat != ''"
    );
    const banks = await pool.query(
      "SELECT DISTINCT bank FROM customers WHERE bank IS NOT NULL AND bank != ''"
    );
    const loanTypes = await pool.query(
      "SELECT DISTINCT product FROM customers WHERE product IS NOT NULL AND product != ''"
    );

    return {
      segments: segments.rows.map((r) => r.custsegment),
      categories: categories.rows.map((r) => r.compcat),
      banks: banks.rows.map((r) => r.bank),
      loanTypes: loanTypes.rows.map((r) => r.product),
    };
  }

  async getLoanList() {
    const { rows } = await pool.query("SELECT * FROM GetLoanList()");
    return rows;
  }

  /* =========================
   * LEAD HELPERS
   * ========================= */

  async findLeadById(id) {
    const { rows } = await pool.query(
      "SELECT firstname, mobilenumber, email FROM leadpersonaldetails WHERE id = $1",
      [id]
    );
    return rows[0];
  }

  async updateLeadTrackFlag(leadid) {
    await pool.query(
      "UPDATE leadtrackdetails SET customer = true WHERE leadid = $1",
      [leadid]
    );
  }

  /* =========================
   * APPOINTMENTS
   * ========================= */

  async getTodayAppointment(empid) {
    const { rows } = await pool.query("SELECT * FROM GetTodayAppoinment($1)", [
      empid,
    ]);
    return rows;
  }

  // Alias
  async selectTodayAppointment(empid) {
    return this.getTodayAppointment(empid);
  }
}

module.exports = new CustomerModel();
