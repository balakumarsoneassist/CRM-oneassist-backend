const metricsModel = require("../models/metrics.model");
const employeeModel = require("../models/employee.model");

class MetricsService {
    async getAllAchievementMetrics() {
        const employees = await employeeModel.findAssignees(); // Reusing findAssignees if it filters for active

        const promises = employees.map(async (emp) => {
            const target = await metricsModel.getTargetMetrics(emp.id);
            const attendedCallsActual = await metricsModel.getAttendedCallsCount(emp.id);
            const dynamicConverted = await metricsModel.getConvertedLeadsCount(emp.id);
            const loginsActual = await metricsModel.getLoginsCount(emp.id);
            const sanctionsActual = await metricsModel.getSanctionsCount(emp.id);
            const disbursementActual = await metricsModel.getDisbursementValue(emp.id);

            return {
                id: emp.id,
                name: emp.name,
                designation: emp.designation,
                image_data: emp.image_data,
                logins_actual: loginsActual,
                sanctions_actual: sanctionsActual,
                disbursement_actual: disbursementActual,
                attended_calls: attendedCallsActual,
                converted_actual: dynamicConverted,
                logins_target: parseInt(target.logins) || 0,
                sanctions_target: parseInt(target.sanctions) || 0,
                disbursement_target: parseInt(target.disbursement_volume) || 0,
                attended_calls_target: parseInt(target.attended_calls_target) || 0,
                converted_target: parseInt(target.converted_leads) || 0,
                // Legacy keys
                logins: parseInt(target.logins) || 0,
                sanctions: parseInt(target.sanctions) || 0,
                converted_leads: dynamicConverted
            };
        });

        const allMetrics = await Promise.all(promises);

        // Calculate Totals for Admin View
        const totals = allMetrics.reduce((acc, curr) => ({
            logins_actual: acc.logins_actual + curr.logins_actual,
            logins_target: acc.logins_target + curr.logins_target,
            sanctions_actual: acc.sanctions_actual + curr.sanctions_actual,
            sanctions_target: acc.sanctions_target + curr.sanctions_target,
            disbursement_actual: acc.disbursement_actual + curr.disbursement_actual,
            disbursement_target: acc.disbursement_target + curr.disbursement_target,
            attended_calls: acc.attended_calls + curr.attended_calls,
            attended_calls_target: acc.attended_calls_target + curr.attended_calls_target,
            converted_actual: acc.converted_actual + curr.converted_actual,
            converted_target: acc.converted_target + curr.converted_target
        }), {
            logins_actual: 0, logins_target: 0, sanctions_actual: 0, sanctions_target: 0,
            disbursement_actual: 0, disbursement_target: 0, attended_calls: 0, attended_calls_target: 0,
            converted_actual: 0, converted_target: 0
        });

        return {
            data: allMetrics,
            totals,
            totalCount: allMetrics.length
        };
    }

    async getTargetMetrics(targetId) {
        const target = await metricsModel.getTargetMetrics(targetId);
        const attendedCalls = await metricsModel.getAttendedCallsCount(targetId);
        const dynamicConverted = await metricsModel.getConvertedLeadsCount(targetId);
        const loginsActual = await metricsModel.getLoginsCount(targetId);
        const sanctionsActual = await metricsModel.getSanctionsCount(targetId);
        const disbursementActual = await metricsModel.getDisbursementValue(targetId);

        return {
            employeeId: targetId,
            logins_actual: loginsActual,
            sanctions_actual: sanctionsActual,
            disbursement_actual: disbursementActual,
            attended_calls: attendedCalls,
            converted_actual: dynamicConverted,
            logins_target: parseInt(target.logins) || 0,
            sanctions_target: parseInt(target.sanctions) || 0,
            disbursement_target: parseInt(target.disbursement_volume) || 0,
            attended_calls_target: parseInt(target.attended_calls_target) || 0,
            converted_target: parseInt(target.converted_leads) || 0,
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
}

module.exports = new MetricsService();
