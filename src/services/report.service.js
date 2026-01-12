const ReportModel = require('../models/report.model');

class ReportService {
    async getOverallStatus(orgid, empid) {
        return await ReportModel.selectOverallStatus(orgid, empid);
    }

    async getLeadFollowAllStatusReport(orgid, statuscode, empid) {
        return await ReportModel.selectLeadFollowAllStatus(orgid, statuscode, empid);
    }

    async getContactFollowAllStatusReport(orgid, statuscode, empid) {
        return await ReportModel.selectContactFollowAllStatus(orgid, statuscode, empid);
    }

    async getLCFollowEmpStatusReport(orgid, statuscode, empid) {
        const sc = parseInt(statuscode);
        if (sc < 11) {
            const rows = await ReportModel.selectContactFollowEmp(orgid, sc, empid);
            return { rows, functionUsed: 'ContactFollowedByEmp' };
        } else {
            const rows = await ReportModel.selectLeadFollowEmp(orgid, sc, empid);
            return { rows, functionUsed: 'LeadFollowedByEmp' };
        }
    }

    async getUserReport(query) {
        const { assignee, startdate, enddate } = query;
        return await ReportModel.selectUserReport(assignee, startdate, enddate);
    }

    async getDashboardUser(empid) {
        return await ReportModel.selectDashboardUser(empid);
    }

    async getDashboardAdmin() {
        return await ReportModel.selectDashboardAdmin();
    }
}

module.exports = new ReportService();
