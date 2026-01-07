const MasterModel = require('../models/master.model');

class MasterService {
    // Branch
    async createBranch(data) {
        const { location, name, isactive } = data;
        return await MasterModel.insertBranch([location, name, isactive]);
    }

    async updateBranch(id, data) {
        const { location, name, isactive } = data;
        return await MasterModel.updateBranch([location, name, isactive, id]);
    }

    async getBranches(query) {
        let { location, name, isactive } = query;
        const conditions = [];
        const values = [];
        if (location) { values.push(`%${location}%`); conditions.push(`location ILIKE $${values.length}`); }
        if (typeof isactive !== 'undefined') { values.push(isactive === 'true'); conditions.push(`isactive = $${values.length}`); }
        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const q = `SELECT * FROM branchmaster ${whereClause} ORDER BY id DESC`;
        return await MasterModel.selectBranches(q, values);
    }

    // Location
    async createLocation(data) {
        const { location, state } = data;
        return await MasterModel.insertLocation([location, state]);
    }

    async updateLocation(id, data) {
        const { location, state } = data;
        return await MasterModel.updateLocation([location, state, id]);
    }

    async getLocations(query) {
        let { location, state } = query;
        const conditions = [];
        const values = [];
        if (location) { values.push(`%${location}%`); conditions.push(`location ILIKE $${values.length}`); }
        if (state) { values.push(`%${state}%`); conditions.push(`state ILIKE $${values.length}`); }
        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const q = `SELECT * FROM locationmaster ${whereClause} ORDER BY id DESC`;
        return await MasterModel.selectLocations(q, values);
    }

    // Bank
    async createBank(data) {
        const { bankname } = data;
        return await MasterModel.insertBank([bankname]);
    }

    async updateBank(id, data) {
        const { bankname } = data;
        return await MasterModel.updateBank([bankname, id]);
    }

    async getBanks() {
        return await MasterModel.selectBanks();
    }

    async getBankById(id) {
        return await MasterModel.selectBankById(id);
    }

    async getLoanList() {
        return await MasterModel.selectLoanList();
    }
}

module.exports = new MasterService();
