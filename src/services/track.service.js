const trackModel = require("../models/track.model");
const leadModel = require("../models/lead.model");

class TrackService {
    async saveLeadTrackHistory(data) {
        if (!data.tracknumber || !data.leadid) throw { status: 400, message: "tracknumber and leadid are required" };

        const newRecord = await trackModel.createHistory(data);

        // Sync status with leadpersonaldetails
        try {
            await leadModel.updatePersonal(newRecord.leadid, ["status = $1"], [newRecord.status, newRecord.leadid]);
        } catch (err) {
            console.error("Failed to sync status to leadpersonaldetails:", err);
        }

        return newRecord;
    }

    async saveLeadTrackDetails(data) {
        if (!data.leadid) throw { status: 400, message: "leadid is required" };

        const newRecord = await trackModel.createDetails(data);

        // Insert history
        try {
            await trackModel.createHistory({
                tracknumber: newRecord.tracknumber,
                leadid: newRecord.leadid,
                appoinmentdate: newRecord.appoinmentdate,
                status: newRecord.status,
                notes: newRecord.notes,
                isdirectmeet: newRecord.isdirectmeet,
                createon: new Date(),
                contactfollowedby: newRecord.contactfollowedby,
                leadfollowedby: newRecord.leadfollowedby
            });
            await leadModel.updatePersonal(newRecord.leadid, ["status = $1"], [newRecord.status, newRecord.leadid]);
        } catch (err) {
            console.error("Secondary updates failed in saveLeadTrackDetails:", err);
        }

        return newRecord;
    }

    async updateLeadTrackDetails(tracknumber, data) {
        const fields = [
            "leadid", "appoinmentdate", "status", "notes", "isdirectmeet", "occupationtype", "loantype",
            "desireloanamount", "tenure", "preferedbank", "cibilscore", "incometype", "incomeamount",
            "isidproof", "isageproof", "isaddessproof", "iscreditcardstatement", "isexistingloantrack",
            "iscurrentaccountstatement", "isstabilityproof", "isbankstatement", "ispayslip", "isform16",
            "isbusinessproof", "isitr", "isgststatement", "isencumbrancecertificate", "istitledeed",
            "isparentdeed", "islayoutplan", "isregulationorder", "isbuildingpermit", "ispropertytax",
            "ispatta", "isconstructionagreement", "issaleagreement", "isapf", "isudsregistration",
            "isrcbook", "bankname", "applicationnumber", "logindate", "loginvalue", "sanctionroi",
            "sanctiontenure", "sanctionletter", "sanctionvalue", "sanctiondate", "psdcondition",
            "islegal", "istechnical", "legalreport", "technicalreport", "ispsdconditionverified",
            "modifyon", "contactfollowedby", "leadfollowedby", "isnoresponse", "organizationid",
            "payoutpercent", "ispaid", "connectorcontactid", "disbursementamount", "customername",
            "datastrength", "compname", "compcat", "custsegment"
        ];

        const updates = [];
        const values = [];
        fields.forEach(col => {
            if (data[col] !== undefined) {
                values.push(data[col]);
                updates.push(`${col} = $${values.length}`);
            }
        });

        if (updates.length === 0) throw { status: 400, message: "No fields to update" };
        values.push(tracknumber);

        const updatedRecord = await trackModel.updateDetails(tracknumber, updates, values);
        if (!updatedRecord) throw { status: 404, message: "Record not found" };

        // Insert history & sync status
        try {
            await trackModel.createHistory({
                tracknumber: updatedRecord.tracknumber,
                leadid: updatedRecord.leadid,
                appoinmentdate: updatedRecord.appoinmentdate,
                status: updatedRecord.status,
                notes: updatedRecord.notes,
                isdirectmeet: updatedRecord.isdirectmeet,
                createon: new Date(),
                contactfollowedby: updatedRecord.contactfollowedby,
                leadfollowedby: updatedRecord.leadfollowedby
            });
            await leadModel.updatePersonal(updatedRecord.leadid, ["status = $1"], [updatedRecord.status, updatedRecord.leadid]);
        } catch (err) {
            console.error("Secondary updates failed in updateLeadTrackDetails:", err);
        }

        return updatedRecord;
    }

    async getCallHistory(tracknumber) {
        return await trackModel.findHistoryByTrack(tracknumber);
    }

    async getLeadTrackDetails(tracknumber) {
        const record = await trackModel.findDetailsByTrack(tracknumber);
        if (!record) throw { status: 404, message: "Record not found" };
        return record;
    }

    async getOverallStatus(orgid) {
        return await trackModel.getOverallStatus(orgid);
    }

    async getLeadFollowedByAll(orgid, statuscode) {
        return await trackModel.getLeadFollowedByAll(orgid, statuscode);
    }

    async getContactFollowedByAll(orgid, statuscode) {
        return await trackModel.getContactFollowedByAll(orgid, statuscode);
    }
}

module.exports = new TrackService();
