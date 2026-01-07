const SalesModel = require('../models/sales.model');

class SalesService {
    async saveSalesVisit(data) {
        const { name, mobileno, profession, designation, location, distance, notes, createdby, contactflag, dateofvisit, nextvisit, remarks } = data;
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
        const { custid, dateofvisit, nextvisit, remarks } = data;
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
