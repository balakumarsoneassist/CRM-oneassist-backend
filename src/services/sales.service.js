const SalesModel = require('../models/sales.model');
const LeadModel = require('../models/lead.model');

class SalesService {
    async saveSalesVisit(data) {
        const { name, mobileno, profession, designation, location, notes, contactflag, remarks } = data;
        let { dateofvisit, nextvisit, distance, createdby } = data;

        // Sanitize dates: If empty string, set to null
        if (dateofvisit === '') dateofvisit = null;
        if (nextvisit === '') nextvisit = null;

        // Sanitize Integers
        if (distance === '' || distance === null) distance = 0;
        if (createdby === '' || createdby === null) createdby = 0;

        // Check if customer exists
        let customer = await SalesModel.findByMobile(mobileno);

        if (!customer) {
            customer = await SalesModel.insertCustomer([name, mobileno, profession, designation, location, distance, notes, createdby, contactflag]);
        }

        // Optionally update existing customer details if needed, but for now just use the ID

        let track;
        try {
            track = await SalesModel.insertTrack([customer.id, dateofvisit, nextvisit, remarks]);
        } catch (e) {
            throw { partial: true, error: e, customer };
        }
        return { customer, track };
    }

    async saveSalesVisitTrack(data) {
        let { custid, dateofvisit, nextvisit, remarks, record_type, createdby: reqCreatedBy } = data;

        // If it's a lead, promote it to a Sales Customer first
        if (record_type === 'lead') {
            const lead = await LeadModel.findPersonalById(custid);
            if (!lead) {
                throw new Error('Lead not found for promotion');
            }

            const fullName = (lead.firstname + ' ' + (lead.lastname || '')).trim();
            const location = lead.presentaddress || 'Unknown';
            const mobileno = lead.mobilenumber;
            // Use passed createdby (from frontend) or fallback to lead's creator
            const createdby = reqCreatedBy || lead.createdby || 0;

            // Create Sales Customer
            const newCustomer = await SalesModel.insertCustomer([
                fullName,
                mobileno,
                'Unknown', // Profession
                'Unknown', // Designation
                location,
                0, // Distance
                'Promoted from Direct Meet Lead', // Notes
                createdby, // CreatedBy
                false // ContactFlag
            ]);

            custid = newCustomer.id; // Use the new ID
        }
        // Handle CRM Customer (from Customer List)
        else if (record_type === 'customer') {
            const CustomerModel = require('../models/customer.model');
            // Check if custid is potentially a SalesVisitCustomer ID or a raw Customer ID.
            // Since the user is coming from the main Customer List, it is a raw Customer ID.
            const crmCustomer = await CustomerModel.findById(custid);

            if (crmCustomer) {
                const fullName = crmCustomer.name || 'Unknown';
                const mobileno = crmCustomer.mobilenumber || '';
                const location = crmCustomer.location || crmCustomer.bank || 'Unknown';
                const createdby = reqCreatedBy || 0;

                // Fetch existing or insert new Sales Customer using mobile number for deduplication
                const newCustomer = await SalesModel.insertCustomer([
                    fullName,
                    mobileno,
                    'CRM Customer',
                    'Customer',
                    location,
                    0,
                    `Promoted from CRM Customer ID: ${custid}`,
                    createdby,
                    false
                ]);

                // Update custid to the Sales Visit Customer ID
                custid = newCustomer.id;
            } else {
                console.warn(`[SalesService] CRM Customer ID ${custid} not found.`);
            }
        }

        return await SalesModel.insertTrack([custid, dateofvisit, nextvisit, remarks]);
    }

    async getSVCustomerList(empid) {
        return await SalesModel.selectCustomerList(empid);
    }

    async getSVCustListByCustId(custid) {
        return await SalesModel.selectTrackByCustId(custid);
    }

    async updateSVCustomer(id) {
        return await SalesModel.updateCustomerFlag(id);
    }

    async getSVAllCustomers() {
        return await SalesModel.selectAllCustomersCount();
    }

    async getSVCustomersByEmp(empid) {
        return await SalesModel.selectCustomersByEmp(empid);
    }
}

module.exports = new SalesService();
