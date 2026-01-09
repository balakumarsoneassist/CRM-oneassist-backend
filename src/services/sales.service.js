const SalesModel = require('../models/sales.model');

class SalesService {
    async saveSalesVisit(data) {
        let { name, mobileno, profession, designation, location, distance, notes, createdby, contactflag, dateofvisit, nextvisit, remarks } = data;

        // Clean data for database compatibility
        distance = (distance === '' || distance === undefined || distance === null) ? null : parseInt(distance);
        dateofvisit = (dateofvisit === '' || !dateofvisit) ? null : dateofvisit.replace('T', ' ');
        nextvisit = (nextvisit === '' || !nextvisit) ? null : nextvisit.replace('T', ' ');
        profession = profession || null;
        designation = designation || null;
        location = location || null;
        notes = notes || null;
        remarks = remarks || null;
        contactflag = (contactflag === true || contactflag === 'true') ? true : false;

        // Ensure createdby is a valid integer or null for database compatibility
        if (createdby !== null && createdby !== undefined) {
            const parsed = parseInt(createdby);
            createdby = isNaN(parsed) ? null : parsed;
        } else {
            createdby = null;
        }

        const customer = await SalesModel.insertCustomer([name, mobileno, profession, designation, location, distance, notes, createdby, contactflag]);

        let track;
        try {
            track = await SalesModel.insertTrack([customer.id, dateofvisit, nextvisit, remarks]);
        } catch (e) {
            throw { partial: true, error: e, customer };
        }
        return { customer, track };
    }

    async saveSalesVisitTrack(data) {
        let { custid, dateofvisit, nextvisit, remarks } = data;

        // Clean data for database compatibility
        dateofvisit = (dateofvisit === '' || !dateofvisit) ? null : dateofvisit;
        nextvisit = (nextvisit === '' || !nextvisit) ? null : nextvisit;
        remarks = remarks || null;

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
