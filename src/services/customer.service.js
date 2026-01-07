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

    async getCustomerList() {
        return await CustomerModel.selectCustomerList();
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
}

module.exports = new CustomerService();
