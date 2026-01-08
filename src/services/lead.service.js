const LeadModel = require('../models/lead.model');

class LeadService {
    // --- Personal ---
    async saveLeadPersonal(data) {
        const pool = require('../db/index');
        const safeVal = (val, type = 'text') => {
            if (val === undefined || val === null || val === '') return null;
            if (type === 'int') {
                const num = Number(val);
                return isNaN(num) ? null : num;
            }
            return val;
        };

        const firstnamePart = (data.firstname || "").substring(0, 4);
        const mobilePart = (data.mobilenumber || "").slice(-4);
        const generatedPassword = `${firstnamePart}@${mobilePart}`;

        const cleanMob = (data.mobilenumber || "").replace(/\D/g, '').slice(-10);
        let currentRemarks = data.remarks || '';

        // Check global verification status
        if (cleanMob) {
            try {
                const { rows: statusRows } = await pool.query('SELECT status FROM whatsapp_verification_status WHERE mobilenumber = $1', [cleanMob]);
                if (statusRows.length > 0) {
                    const globalStatus = statusRows[0].status;
                    if (globalStatus === 'Verified' && !currentRemarks.includes('[WhatsApp Verified]')) {
                        currentRemarks = (currentRemarks.replace('[WhatsApp Requested]', '').replace('[Not on WhatsApp]', '').trim() + ' [WhatsApp Verified]').trim();
                    } else if (globalStatus === 'Not on WhatsApp' && !currentRemarks.includes('[Not on WhatsApp]')) {
                        currentRemarks = (currentRemarks.replace('[WhatsApp Requested]', '').replace('[WhatsApp Verified]', '').trim() + ' [Not on WhatsApp]').trim();
                    } else if (globalStatus === 'Requested' && !currentRemarks.includes('[WhatsApp Requested]') && !currentRemarks.includes('[WhatsApp Verified]')) {
                        currentRemarks = (currentRemarks + ' [WhatsApp Requested]').trim();
                    }
                }
            } catch (err) {
                console.error('Error checking global WhatsApp status in saveLeadPersonal:', err);
            }
        }

        const values = [
            safeVal(data.firstname), safeVal(data.lastname), safeVal(data.mobilenumber), safeVal(data.locationid, 'int'),
            safeVal(data.email), safeVal(data.dateofbirth), safeVal(data.pannumber), safeVal(data.aadharnumber),
            safeVal(data.presentaddress), safeVal(data.pincode), safeVal(data.permanentaddress), safeVal(data.gender),
            safeVal(data.materialstatus), safeVal(data.noofdependent, 'int'), safeVal(data.educationalqualification),
            safeVal(data.type), safeVal(data.status, 'int'), safeVal(data.referencename), safeVal(data.organizationid, 'int'),
            safeVal(data.createdon), safeVal(data.connectorid, 'int'), safeVal(data.createdby), safeVal(data.productname),
            safeVal(currentRemarks), safeVal(data.connectorcontactid, 'int'), safeVal(data.extcustomerid, 'int'), safeVal(data.contacttype),
            safeVal(data.whatsappnumber),
        ];

        const contact = await LeadModel.insertPersonal(values);
        return { contact, generatedPassword };
    }

    async getLeadPersonalList(query) {
        let { firstname, mobilenumber, page = 1, limit = 10 } = query;
        console.log('🔍 LeadService.getLeadPersonalList Query:', { firstname, mobilenumber, page, limit });

        page = parseInt(page, 10) || 1;
        limit = parseInt(limit, 10) || 10;
        if (limit > 100) limit = 100;

        const conditions = [];
        const values = [];
        let idx = 1;

        if (firstname) {
            conditions.push(`LOWER(firstname) LIKE LOWER($${idx})`);
            values.push(`%${firstname}%`);
            idx += 1;
        }
        if (mobilenumber) {
            // Clean the search term to digits only and take last 10 for consistency
            const cleanSearch = mobilenumber.replace(/\D/g, '').slice(-10);

            // Search by stripping formatting from DB column too (Postgres)
            conditions.push(`REGEXP_REPLACE(mobilenumber, '[^0-9]', '', 'g') LIKE $${idx}`);
            values.push(`%${cleanSearch}%`);
            idx += 1;
            console.log(`📱 Searching for mobile digits (matching end): %${cleanSearch}%`);
        }

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (page - 1) * limit;
        values.push(limit);
        values.push(offset); // idx+1

        const dataQuery = `SELECT * FROM leadpersonaldetails ${whereClause} ORDER BY id DESC LIMIT $${idx} OFFSET $${idx + 1}`;
        const countQuery = `SELECT COUNT(*) FROM leadpersonaldetails ${whereClause}`;

        const { dataRows, count } = await LeadModel.selectPersonalList(dataQuery, countQuery, values, values.slice(0, idx - 1));

        return { total: parseInt(count, 10), page, limit, data: dataRows };
    }

    async getLeadPersonalById(id) {
        return await LeadModel.selectPersonalById(id);
    }

    async updateLeadPersonal(id, data) {
        const cols = [
            'firstname', 'lastname', 'mobilenumber', 'locationid', 'email', 'dateofbirth',
            'pannumber', 'aadharnumber', 'presentaddress', 'pincode', 'permanentaddress',
            'gender', 'materialstatus', 'noofdependent', 'educationalqualification', 'type',
            'status', 'referencename', 'organizationid', 'createdon', 'connectorid',
            'createdby', 'productname', 'remarks', 'connectorcontactid', 'extcustomerid', 'contacttype',
            'whatsappnumber'
        ];
        const pool = require('../db/index');
        const cleanMob = (data.mobilenumber || "").replace(/\D/g, '').slice(-10);

        const values = [];
        const sets = [];
        for (let i = 0; i < cols.length; i++) {
            const c = cols[i];
            let val = data[c];

            // If updating remarks, or if updating mobile number, we might want to sync status
            if (c === 'remarks' && cleanMob) {
                try {
                    const { rows: statusRows } = await pool.query('SELECT status FROM whatsapp_verification_status WHERE mobilenumber = $1', [cleanMob]);
                    if (statusRows.length > 0) {
                        const globalStatus = statusRows[0].status;
                        const currentRem = val || '';
                        if (globalStatus === 'Verified' && !currentRem.includes('[WhatsApp Verified]')) {
                            val = (currentRem.replace('[WhatsApp Requested]', '').replace('[Not on WhatsApp]', '').trim() + ' [WhatsApp Verified]').trim();
                        } else if (globalStatus === 'Not on WhatsApp' && !currentRem.includes('[Not on WhatsApp]')) {
                            val = (currentRem.replace('[WhatsApp Requested]', '').replace('[WhatsApp Verified]', '').trim() + ' [Not on WhatsApp]').trim();
                        }
                    }
                } catch (err) {
                    console.error('Error checking global WhatsApp status in updateLeadPersonal:', err);
                }
            }

            // Sanitization: If date fields are invalid strings like "1", set to null
            if ((c === 'dateofbirth' || c === 'createdon') && val) {
                if (isNaN(Date.parse(val))) {
                    console.log(`⚠️ Sanitizing invalid date field "${c}": ${val} -> null`);
                    val = null;
                }
            }
            sets.push(`${c} = COALESCE($${i + 1}, ${c})`);
            values.push(val);
        }
        values.push(id);
        const query = `UPDATE leadpersonaldetails SET ${sets.join(', ')} WHERE id=$${values.length} RETURNING *`;
        return await LeadModel.updatePersonal(query, values);
    }

    // --- Occupation ---
    async saveOccupation(data) {
        const { leadpersonal, occupation, incometype, companyname, companyaddress, designation, joiningdate, officetelephonenumber, companygstinnumber, incomeamount } = data;
        const processedJoiningDate = joiningdate && joiningdate.trim() !== '' ? joiningdate : null;
        return await LeadModel.insertOccupation([leadpersonal, occupation, incometype, companyname, companyaddress, designation, processedJoiningDate, officetelephonenumber, companygstinnumber, incomeamount]);
    }

    async updateOccupation(id, data) {
        const { leadpersonal, occupation, incometype, companyname, companyaddress, designation, joiningdate, officetelephonenumber, companygstinnumber, incomeamount } = data;
        const processedJoiningDate = joiningdate && joiningdate.trim() !== '' ? joiningdate : null;
        return await LeadModel.updateOccupation([leadpersonal, occupation, incometype, companyname, companyaddress, designation, processedJoiningDate, officetelephonenumber, companygstinnumber, incomeamount, id]);
    }

    async getOccupationByLeadPersonal(leadpersonal) {
        return await LeadModel.selectOccupationByLead(leadpersonal);
    }

    // --- Bank ---
    async saveBank(data) {
        const { leadpersonal, bankname, branch, ifsccode, accountnumber } = data;
        return await LeadModel.insertBank([leadpersonal, bankname, branch, ifsccode, accountnumber]);
    }

    async updateBank(id, data) {
        const { leadpersonal, bankname, branch, ifsccode, accountnumber } = data;
        return await LeadModel.updateBank([leadpersonal, bankname, branch, ifsccode, accountnumber, id]);
    }

    async getBankByLeadPersonal(leadpersonal) {
        return await LeadModel.selectBankByLead(leadpersonal);
    }

    // --- Loan History ---
    async saveLoanHistory(data) {
        const { leadpersonal, loantype, roi, loanamount, bankname, branchname, disbursementdate, tenure } = data;
        const processedDisbursementDate = disbursementdate && disbursementdate.trim() !== '' ? disbursementdate : null;
        return await LeadModel.insertLoanHistory([leadpersonal, loantype, roi, loanamount, bankname, branchname, processedDisbursementDate, tenure]);
    }

    async updateLoanHistory(id, data) {
        const { leadpersonal, loantype, roi, loanamount, bankname, branchname, disbursementdate, tenure } = data;
        const processedDisbursementDate = disbursementdate && disbursementdate.trim() !== '' ? disbursementdate : null;
        return await LeadModel.updateLoanHistory([leadpersonal, loantype, roi, loanamount, bankname, branchname, processedDisbursementDate, tenure, id]);
    }

    async getLoanHistoryByLeadPersonal(leadpersonal) {
        return await LeadModel.selectLoanHistoryByLead(leadpersonal);
    }

    // --- Track ---
    async saveTrackHistory(data) {
        const historyFields = ['tracknumber', 'leadid', 'appoinmentdate', 'status', 'notes', 'isdirectmeet', 'createon', 'contactfollowedby', 'leadfollowedby'];
        const placeholders = historyFields.map((_, idx) => `$${idx + 1}`).join(', ');
        const values = historyFields.map((col) => (col in data ? data[col] : null));

        const query = `INSERT INTO leadtrackhistorydetails (${historyFields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const newRecord = await LeadModel.insertTrackHistory(query, values);

        if (newRecord.status && newRecord.leadid) {
            LeadModel.updateStatus(newRecord.leadid, newRecord.status).catch(e => console.error(e));
        }
        return newRecord;
    }

    async saveTrackDetails(data) {
        const fields = [
            'leadid', 'appoinmentdate', 'status', 'notes', 'isdirectmeet', 'occupationtype', 'loantype', 'desireloanamount', 'tenure', 'preferedbank', 'cibilscore', 'incometype', 'incomeamount', 'isidproof', 'isageproof', 'isaddessproof', 'iscreditcardstatement', 'isexistingloantrack', 'iscurrentaccountstatement', 'isstabilityproof', 'isbankstatement', 'ispayslip', 'isform16', 'isbusinessproof', 'isitr', 'isgststatement', 'isencumbrancecertificate', 'istitledeed', 'isparentdeed', 'islayoutplan', 'isregulationorder', 'isbuildingpermit', 'ispropertytax', 'ispatta', 'isconstructionagreement', 'issaleagreement', 'isapf', 'isudsregistration', 'isrcbook', 'bankname', 'applicationnumber', 'logindate', 'loginvalue', 'sanctionroi', 'sanctiontenure', 'sanctionletter', 'sanctionvalue', 'sanctiondate', 'psdcondition', 'islegal', 'istechnical', 'legalreport', 'technicalreport', 'ispsdconditionverified', 'modifyon', 'contactfollowedby', 'leadfollowedby', 'isnoresponse', 'organizationid', 'payoutpercent', 'ispaid', 'connectorcontactid', 'disbursementamount', 'customername', 'datastrength', 'compname', 'compcat', 'custsegment'
        ];
        const placeholders = fields.map((_, idx) => `$${idx + 1}`).join(', ');
        const values = fields.map((col) => (col in data ? data[col] : null));

        const query = `INSERT INTO leadtrackdetails (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
        const newRecord = await LeadModel.insertTrackDetails(query, values);

        // History insert
        // Note: this history insert logic is manual here, not reused saveTrackHistory because of field mapping?
        // Actually I can reuse saveTrackHistory if I map the fields?
        // But history insert in saveTrackHistory uses req.body fields directly. Here we use values from newRecord.
        // I'll keep explicit query for history here to be safe, but use Model.
        const historyQuery = `INSERT INTO leadtrackhistorydetails (tracknumber, leadid, appoinmentdate, status, notes, isdirectmeet, createon, contactfollowedby, leadfollowedby) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`;
        const historyValues = [newRecord.tracknumber, newRecord.leadid, newRecord.appoinmentdate, newRecord.status, newRecord.notes, newRecord.isdirectmeet, new Date(), newRecord.contactfollowedby, newRecord.leadfollowedby];
        LeadModel.insertTrackHistory(historyQuery, historyValues).catch(e => console.error(e));

        // Status update
        LeadModel.updateStatus(newRecord.leadid, newRecord.status).catch(e => console.error(e));

        return newRecord;
    }

    async updateTrackDetails(tracknumber, data) {
        const WhatsAppService = require('./whatsapp.service');
        const fields = [
            'leadid', 'appoinmentdate', 'status', 'notes', 'isdirectmeet', 'occupationtype', 'loantype', 'desireloanamount', 'tenure', 'preferedbank', 'cibilscore', 'incometype', 'incomeamount', 'isidproof', 'isageproof', 'isaddessproof', 'iscreditcardstatement', 'isexistingloantrack', 'iscurrentaccountstatement', 'isstabilityproof', 'isbankstatement', 'ispayslip', 'isform16', 'isbusinessproof', 'isitr', 'isgststatement', 'isencumbrancecertificate', 'istitledeed', 'isparentdeed', 'islayoutplan', 'isregulationorder', 'isbuildingpermit', 'ispropertytax', 'ispatta', 'isconstructionagreement', 'issaleagreement', 'isapf', 'isudsregistration', 'isrcbook', 'bankname', 'applicationnumber', 'logindate', 'loginvalue', 'sanctionroi', 'sanctiontenure', 'sanctionletter', 'sanctionvalue', 'sanctiondate', 'psdcondition', 'islegal', 'istechnical', 'legalreport', 'technicalreport', 'ispsdconditionverified', 'modifyon', 'contactfollowedby', 'leadfollowedby', 'isnoresponse', 'organizationid', 'payoutpercent', 'ispaid', 'connectorcontactid', 'disbursementamount', 'customername', 'datastrength', 'compname', 'compcat', 'custsegment'
        ];

        // Get existing data before update to check for changes
        const oldData = await this.getTrackDetails(tracknumber);
        const leadPersonal = oldData?.leadid ? await this.getLeadPersonalById(oldData.leadid) : null;
        const mobile = leadPersonal?.mobilenumber;

        const setClauses = [];
        const values = [];
        fields.forEach((col) => {
            if (col in data) {
                values.push(data[col]);
                setClauses.push(`${col} = $${values.length}`);
            }
        });

        if (setClauses.length === 0) throw new Error('No fields provided to update');
        values.push(tracknumber);

        const query = `UPDATE leadtrackdetails SET ${setClauses.join(', ')} WHERE tracknumber = $${values.length} RETURNING *`;
        const updatedRecord = await LeadModel.updateTrackDetails(query, values);
        if (!updatedRecord) return null;

        // Trigger WhatsApp Notifications if mobile exists
        if (mobile && updatedRecord) {
            try {
                // 1. Appointment Date Fixed/Changed
                const isNewAppointment = !oldData?.appoinmentdate && updatedRecord.appoinmentdate;
                const isAppointmentChanged = oldData?.appoinmentdate && updatedRecord.appoinmentdate &&
                    new Date(oldData.appoinmentdate).getTime() !== new Date(updatedRecord.appoinmentdate).getTime();

                if (isNewAppointment || isAppointmentChanged) {
                    const dateObj = new Date(updatedRecord.appoinmentdate);
                    const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(':', '.');

                    const combinedDateTime = `${dateStr} at ${timeStr}`;

                    const components = [
                        {
                            type: 'body', parameters: [
                                { type: 'text', text: combinedDateTime }
                            ]
                        }
                    ];
                    WhatsAppService.sendTemplateMessage(mobile, 'appointment_date', 'en_US', components)
                        .then(r => console.log('Appointment WhatsApp Sent:', r))
                        .catch(e => console.error('WS Appointment Error:', e));
                }

                // 2. Status Specific Messages
                if (data.status && data.status !== oldData?.status) {
                    const status = parseInt(data.status);

                    if (status === 12) { // Document Collection
                        const components = [{
                            type: 'body',
                            parameters: [
                                { type: 'text', text: updatedRecord.isidproof ? 'Aadhar' : ' ' },
                                { type: 'text', text: updatedRecord.isageproof ? 'PAN' : ' ' },
                                { type: 'text', text: updatedRecord.isbankstatement ? 'Bank Passbook' : ' ' },
                                { type: 'text', text: updatedRecord.ispayslip ? 'Payslip' : ' ' }
                            ]
                        }];
                        WhatsAppService.sendTemplateMessage(mobile, 'document_collection', 'en_US', components).catch(e => console.error('WS Status 12 Error:', e));
                    } else if (status === 23) { // Document Rejected
                        WhatsAppService.sendTemplateMessage(mobile, 'document_rejected', 'en_US', []).catch(e => console.error('WS Status 23 Error:', e));
                    } else if (status === 13) { // File Login
                        WhatsAppService.sendTemplateMessage(mobile, 'file_login', 'en_US').catch(e => console.error('WS Status 13 Error:', e));
                    } else if (status === 22) { // Failed to attend call (Service Message)
                        WhatsAppService.sendServiceMessage(mobile, "We tried calling you but couldn't reach. We will call you back later.").catch(e => console.error('WS Service Message Error:', e));
                    }
                }
            } catch (err) {
                console.error('WhatsApp Notification Trigger Error:', err);
            }
        }

        // History
        const historyQuery = `INSERT INTO leadtrackhistorydetails (tracknumber, leadid, appoinmentdate, status, notes, isdirectmeet, createon, contactfollowedby, leadfollowedby) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`;
        const historyValues = [updatedRecord.tracknumber, updatedRecord.leadid, updatedRecord.appoinmentdate, updatedRecord.status, updatedRecord.notes, updatedRecord.isdirectmeet, new Date(), updatedRecord.contactfollowedby, updatedRecord.leadfollowedby];
        LeadModel.insertTrackHistory(historyQuery, historyValues).catch(e => console.error(e));

        // Status update
        LeadModel.updateStatus(updatedRecord.leadid, updatedRecord.status).catch(e => console.error(e));

        // Calculate summary for frontend visibility
        const docs = [];
        if (updatedRecord.isidproof) docs.push('Aadhar');
        if (updatedRecord.isageproof) docs.push('PAN');
        if (updatedRecord.isaddessproof) docs.push('Address Proof');
        if (updatedRecord.isbankstatement) docs.push('Bank Passbook');
        if (updatedRecord.ispayslip) docs.push('Payslip');
        updatedRecord.requestedDocs = docs.join(', ');

        return updatedRecord;
    }

    async getCallHistory(tracknumber) {
        return await LeadModel.selectCallHistory(tracknumber);
    }

    async getTrackDetails(tracknumber) {
        return await LeadModel.selectTrackDetails(tracknumber);
    }

    async getTrackDetailsByLeadId(leadid) {
        return await LeadModel.selectTrackDetailsByLeadId(leadid);
    }
}

module.exports = new LeadService();
