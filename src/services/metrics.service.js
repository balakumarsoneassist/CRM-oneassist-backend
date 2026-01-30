const metricsModel = require("../models/metrics.model");
const employeeModel = require("../models/employee.model");
const { connectorLogin } = require("../controllers/connector.controller");

class MetricsService {
    async getAllAchievementMetrics(params) {
        const { page = 1, limit = 10, search = '', designation, sortBy, sortOrder, fromDate, toDate } = params;
        console.log(params)
        const offset = (page - 1) * limit;

        const allMetrics = await employeeModel.findPaginatedAssignees({
            search, limit, offset, designation, sortBy, sortOrder, fromDate, toDate
        });

        const totalCount = await employeeModel.countAssignees({ search, designation });

        // Calculate Totals for Admin View (Current Page Only, as per request scope)
        // If strictly required across ALL pages, we'd need a separate aggregate query.
        // For performance, we stick to current page totals for the 'Admin Dashboard' snapshot or implement a global sum later.
        const totals = allMetrics.reduce((acc, curr) => ({

            logins_actual: acc.logins_actual + (parseInt(curr.logins) || 0),
            logins_target: acc.logins_target + (parseInt(curr.logins_target) || 0),
            sanctions_actual: acc.sanctions_actual + (parseInt(curr.sanctions) || 0),
            sanctions_target: acc.sanctions_target + (parseInt(curr.sanctions_target) || 0),
            disbursement_actual: acc.disbursement_actual + (parseFloat(curr.disbursement_volume) || 0),
            disbursement_target: acc.disbursement_target + (parseInt(curr.disbursement_target) || 0),
            attended_calls: acc.attended_calls + (parseInt(curr.attended_calls) || 0),
            attended_calls_target: acc.attended_calls_target + (parseInt(curr.attended_calls_target) || 0),
            converted_actual: acc.converted_actual + (parseInt(curr.converted_leads) || 0),
            converted_target: acc.converted_target + (parseInt(curr.converted_target) || 0),
            revenue_target: acc.revenue_target + (parseFloat(curr.revenue_target) || 0),
            revenue_achievement: acc.revenue_achievement + (parseFloat(curr.revenue_achievement) || 0)
        }), {
            logins_actual: 0, logins_target: 0, sanctions_actual: 0, sanctions_target: 0,
            disbursement_actual: 0, disbursement_target: 0, attended_calls: 0, attended_calls_target: 0,
            converted_actual: 0, converted_target: 0, revenue_target: 0, revenue_achievement: 0
        });

        // Map definitions to match frontend expected structure if necessary
        const data = allMetrics.map(m => ({
            ...m,
            logins_actual: parseInt(m.logins) || 0,
            sanctions_actual: parseInt(m.sanctions) || 0,
            disbursement_actual: parseFloat(m.disbursement_volume) || 0,
            converted_actual: parseInt(m.converted_leads) || 0,
            attended_calls: parseInt(m.attended_calls) || 0,
            revenue_target: parseFloat(m.revenue_target) || 0,
            revenue_achievement: parseFloat(m.revenue_achievement) || 0,

        }));

        return {
            data,
            totals,
            totalCount
        };
    }

    async getTargetMetrics(targetId) {
        const target = await metricsModel.getTargetMetrics(targetId);
        const attendedCalls = await metricsModel.getAttendedCallsCount(targetId);
        const dynamicConverted = await metricsModel.getConvertedLeadsCount(targetId);
        const loginsActual = await metricsModel.getLoginsCount(targetId);
        const sanctionsActual = await metricsModel.getSanctionsCount(targetId);
        const disbursementActual = await metricsModel.getDisbursementValue(targetId);
        const revenueActual = await metricsModel.getRevenueAchievement(targetId);

        return {
            employeeId: targetId,
            logins_actual: loginsActual,
            sanctions_actual: sanctionsActual,
            disbursement_actual: disbursementActual,
            revenue_achievement: revenueActual,
            attended_calls: attendedCalls,
            converted_actual: dynamicConverted,
            logins_target: parseInt(target.logins) || 0,
            sanctions_target: parseInt(target.sanctions) || 0,
            disbursement_target: parseInt(target.disbursement_volume) || 0,
            attended_calls_target: parseInt(target.attended_calls_target) || 0,
            converted_target: parseInt(target.converted_leads) || 0,
            revenue_target: parseFloat(target.revenue_target) || 0,

            // Legacy
            logins: parseInt(target.logins) || 0,
            sanctions: parseInt(target.sanctions) || 0,
            disbursement_volume: parseInt(target.disbursement_volume) || 0,
            converted_leads: parseInt(target.converted_leads) || 0
        };
    }

    async updateTargetMetrics(id, data) {
        return await metricsModel.updateTargetMetrics(id, data);
    }

    async getTargetAssignmentStatus() {
        const assigned = await metricsModel.getAssignedEmployees();
        const unassigned = await metricsModel.getUnassignedEmployees();
        return { assigned, unassigned };
    }

    async getRevenueBreakdown(empId, fromDate, toDate) {
        return metricsModel.getRevenueBreakdown(empId, fromDate, toDate);
    }
}

module.exports = new MetricsService();
