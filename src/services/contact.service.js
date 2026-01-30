const ContactModel = require('../models/contact.model');

class ContactService {
    async getUnassignedContacts(orgid) {
        return await ContactModel.selectUnassignedContacts(orgid);
    }

    async getAssignedContacts(userid, orgid) {
        return await ContactModel.selectAssignedContacts(userid, orgid);
    }
    async getAllAssignedContacts(orgid) {
        return await ContactModel.selectAllAssignedContacts(orgid);
    }
    async getReassignAssignedContact(leadid, newEmployeeId, orgid) {
        return await ContactModel.reassignAssignedContacts(leadid, newEmployeeId, orgid);
    }
    async getAllTrackedContacts(orgid) {
        return await ContactModel.selectAllTrackedContacts(orgid);
    }


    async getTrackContacts(userid, orgid) {
        return await ContactModel.selectTrackContacts(userid, orgid);
    }

    async getTrackLeads(userid, orgid) {
        return await ContactModel.selectTrackLeads(userid, orgid);
    }

    async getUnassignedLeads(orgid) {
        return await ContactModel.selectUnassignedLeads(orgid);
    }

    async getAssignedLeads(userid, orgid) {
        return await ContactModel.selectAssignedLeads(userid, orgid);
    }
}

module.exports = new ContactService();
