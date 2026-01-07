const ReportModel = require('../models/report.model');

class ReportService {
    async getOverallStatus(orgid) {
        return await ReportModel.selectOverallStatus(orgid);
    }

    async getLeadFollowAllStatusReport(orgid, statuscode) {
        return await ReportModel.selectLeadFollowAllStatus(orgid, statuscode);
    }

    async getContactFollowAllStatusReport(orgid, statuscode) {
        return await ReportModel.selectContactFollowAllStatus(orgid, statuscode);
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

    async getUserReport(assignee, startdate, enddate) {
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
