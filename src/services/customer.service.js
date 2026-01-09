const CustomerModel = require('../models/customer.model');

class CustomerService {
    async createCustomer(data) {
        const { loandate, location, mobilenumber, product, email, status, bank, disbursedvalue, profile, remarks, notes, newstatus, leadid, leadfollowedby } = data;

        // First, finding lead
        const lead = await CustomerModel.findLeadById(leadid);
        if (!lead) throw new Error('Lead not found');

        // Using Lead data logic from original
        const inserted = await CustomerModel.insertCustomer([
            lead.firstname, loandate, location, lead.mobilenumber, product, lead.email, status, bank, disbursedvalue, profile, remarks, notes, newstatus, leadid, leadfollowedby
        ]);

        await CustomerModel.updateLeadTrackFlag(leadid);

        return inserted;
    }

    async getTodayAppointment(empid) {
        return await CustomerModel.selectTodayAppointment(empid);
    }

    async getCustomerList(followedBy = null) {
        return await CustomerModel.getCustomerList(followedBy);
    }

    async getAllCustomers(filters) {
        const data = await CustomerModel.getAllCustomers(filters);
        const totalCount = await CustomerModel.getAllCustomersCount(filters);

        // Extract filter options for the UI
        const filterOptions = await CustomerModel.getCustomerFilterOptions();

        return {
            data,
            totalCount,
            filterOptions,
            page: filters.page,
            limit: filters.limit
        };
    }

    async reassignToContact(customerId) {
        return await CustomerModel.reassignToContact(customerId);
    }

    async bulkAssignUnassigned(empid, orgid) {
        // New Strategy: Correctly Restore Converted Customers and Cleanup previous mess.
        const pool = require("../db/index");

        // 1. CLEANUP: Remove accidentally created "fake" customer records from the previous bulk run.
        // We identify them by the specific remarks string we used.
        await pool.query(
            "DELETE FROM customers WHERE leadfollowedby = $1 AND remarks = 'Bulk assigned by admin'",
            [empid]
        );

        // 2. RESTORE: Now find the REAL converted customers for this employee.
        const { rows: myCustomers } = await pool.query(
            "SELECT * FROM customers WHERE leadfollowedby = $1",
            [empid]
        );

        let count = 0;

        for (const customer of myCustomers) {

            // Check if this customer is already actively assigned/tracked.
            let isActivelyTracked = false;

            if (customer.leadid) {
                const { rows: trackCheck } = await pool.query(
                    "SELECT 1 FROM leadtrackdetails WHERE leadid = $1",
                    [customer.leadid]
                );
                if (trackCheck.length > 0) isActivelyTracked = true;
            }

            // If it's already actively tracked, we skip it.
            if (isActivelyTracked) continue;

            // Strategy: Find the lead record to link back to.
            const mobile = customer.mobilenumber;
            const { rows: leadMatch } = await pool.query(
                "SELECT id FROM leadpersonaldetails WHERE mobilenumber = $1",
                [mobile]
            );

            if (leadMatch.length > 0) {
                const leadid = leadMatch[0].id; // Use the first matching lead

                try {
                    // 1. Link customer to this lead
                    await pool.query(
                        "UPDATE customers SET leadid = $1 WHERE id = $2",
                        [leadid, customer.id]
                    );

                    // 2. Restore/Create Track
                    const { rows: trackExists } = await pool.query(
                        "SELECT 1 FROM leadtrackdetails WHERE leadid = $1", [leadid]
                    );

                    // Corrected column name: assignedto -> leadfollowedby
                    if (trackExists.length > 0) {
                        await pool.query(
                            "UPDATE leadtrackdetails SET customer = true, leadfollowedby = $2, status = 2 WHERE leadid = $1",
                            [leadid, empid.toString()]
                        );
                    } else {
                        await pool.query(
                            "INSERT INTO leadtrackdetails (leadid, organizationid, customer, status, leadfollowedby, modifyon) VALUES ($1, $2, true, 2, $3, NOW())",
                            [leadid, orgid, empid.toString()]
                        );
                    }

                    // 3. Update Lead Status
                    await pool.query(
                        "UPDATE leadpersonaldetails SET status = 2, type = 'Customer', contacttype = 'Customer' WHERE id = $1",
                        [leadid]
                    );

                    count++;
                } catch (e) {
                    console.warn(`[Bulk Restore] Failed for customer ${customer.id} / lead ${leadid}`, e);
                }
            }
        }

    } // Close bulkAssignUnassigned

    async reassignToEmployee(customerId, empid, orgid, reason) {
        const pool = require("../db/index");

        // Strategy: Find links and move them to the new employee
        // 1. Get Customer Record
        const { rows: cust } = await pool.query("SELECT * FROM customers WHERE id = $1", [customerId]);
        if (cust.length === 0) throw new Error("Customer not found");
        const customer = cust[0];

        const previousEmpId = customer.leadfollowedby; // Capture for timeline

        // 2. Find associated lead
        let leadid = customer.leadid;
        if (!leadid) {
            // Try matching by mobile if leadid is broken
            const { rows: leadbox } = await pool.query("SELECT id FROM leadpersonaldetails WHERE mobilenumber = $1", [customer.mobilenumber]);
            if (leadbox.length > 0) leadid = leadbox[0].id;
        }

        if (!leadid) {
            console.warn(`[Reassign] Associated Lead not found for customer ${customerId}. Proceeding with Customer-only update.`);
        }

        // 3. Perform Reassignment

        // A. Update Customer Table
        // If we found a lead link (restored), we update it. If not, we keep it as is (null).
        await pool.query(
            "UPDATE customers SET leadid = $1, leadfollowedby = $2 WHERE id = $3",
            [leadid || customer.leadid, empid, customerId]
        );

        // Only update Lead tables if we actually have a Lead ID
        if (leadid) {
            // B. Update/Create Track
            const { rows: trackExists } = await pool.query(
                "SELECT 1 FROM leadtrackdetails WHERE leadid = $1", [leadid]
            );

            if (trackExists.length > 0) {
                await pool.query(
                    "UPDATE leadtrackdetails SET customer = true, leadfollowedby = $2, status = 2 WHERE leadid = $1",
                    [leadid, empid.toString()]
                );
            } else {
                await pool.query(
                    "INSERT INTO leadtrackdetails (leadid, organizationid, customer, status, leadfollowedby, modifyon) VALUES ($1, $2, true, 2, $3, NOW())",
                    [leadid, orgid, empid.toString()]
                );
            }

            // C. Update Lead Personal Details
            await pool.query(
                "UPDATE leadpersonaldetails SET status = 2, type = 'Customer', contacttype = 'Customer' WHERE id = $1",
                [leadid]
            );
        }

        // D. Insert into Timeline
        if (reason) {
            await pool.query(
                "INSERT INTO customer_timeline (customer_id, action_type, previous_emp_id, new_emp_id, reason, performed_at) VALUES ($1, 'REASSIGN', $2, $3, $4, NOW())",
                [customerId, previousEmpId || null, empid, reason]
            );
        }

        return { success: true, message: leadid ? "reasigned_fully" : "reasigned_customer_only" };
    }

    async getTimeline(customerId) {
        const pool = require("../db/index");
        // Joining with employeedetails table to get names.
        const query = `
            SELECT 
                ct.*, 
                p.name as previous_emp_name, 
                n.name as new_emp_name 
            FROM customer_timeline ct 
            LEFT JOIN employeedetails p ON ct.previous_emp_id = p.id 
            LEFT JOIN employeedetails n ON ct.new_emp_id = n.id 
            WHERE ct.customer_id = $1 
            ORDER BY ct.performed_at DESC
        `;
        const { rows } = await pool.query(query, [customerId]);
        return rows;
    }
}

module.exports = new CustomerService();
