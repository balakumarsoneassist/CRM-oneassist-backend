const WhatsAppService = require('../services/whatsapp.service');
const LeadService = require('../services/lead.service');
const pool = require('../db/index');

// Helper to track status by mobile independently of Lead records
const updateWhatsAppVerificationStatus = async (mobile, status, remarks = '') => {
    try {
        const cleanMob = mobile.replace(/\D/g, '').slice(-10);
        await pool.query(
            `INSERT INTO whatsapp_verification_status (mobilenumber, status, remarks, updated_at) 
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (mobilenumber) 
             DO UPDATE SET status = $2, remarks = $3, updated_at = CURRENT_TIMESTAMP`,
            [cleanMob, status, remarks]
        );
        console.log(`📡 WEBHOOK ACTION TRACKED: ${cleanMob} -> ${status}`);
    } catch (err) {
        if (err.code === '42P01') { // Table doesn't exist
            await pool.query('CREATE TABLE IF NOT EXISTS whatsapp_verification_status (mobilenumber TEXT PRIMARY KEY, status TEXT, remarks TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)');
            return updateWhatsAppVerificationStatus(mobile, status, remarks);
        }
        console.error('❌ Error updating WhatsApp status:', err);
    }
};

exports.getStatus = async (req, res) => {
    const { mobile } = req.params;
    if (!mobile) return res.status(400).json({ error: 'Mobile required' });
    try {
        const cleanMob = mobile.replace(/\D/g, '').slice(-10);
        const { rows } = await pool.query('SELECT * FROM whatsapp_verification_status WHERE mobilenumber = $1', [cleanMob]);
        res.json({ success: true, data: rows[0] || { status: 'none' } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    console.log(`\n--- Webhook Verification Attempt ---`);
    console.log(`Mode: ${mode}`);
    console.log(`Token: ${token}`);

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
            console.log('✅ WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            console.log('❌ WEBHOOK_VERIFICATION_FAILED');
            res.sendStatus(403);
        }
    }
};

exports.handleWebhook = async (req, res) => {
    const body = req.body;

    console.log('\n--- 📥 WhatsApp Webhook Received ---');
    // Reduced verbosity: JSON body removed

    if (body.object === 'whatsapp_business_account' || body.object) {
        try {
            if (body.entry && Array.isArray(body.entry)) {
                for (const entry of body.entry) {
                    if (entry.changes && Array.isArray(entry.changes)) {
                        for (const change of entry.changes) {
                            const value = change.value;

                            // 1. Handle Status Updates
                            if (value.statuses && Array.isArray(value.statuses)) {
                                for (const status of value.statuses) {
                                    const recipientId = status.recipient_id || status.wa_id;
                                    const statusVal = status.status;

                                    if (recipientId) {
                                        const cleanMob = recipientId.replace(/\D/g, '').slice(-10);
                                        console.log(`📢 Webhook Status Update: ${recipientId} (${cleanMob}) -> ${statusVal}`);

                                        // Lookup lead by last 10 digits to update remarks if lead exists
                                        const leads = await LeadService.getLeadPersonalList({ mobilenumber: cleanMob });

                                        if (leads.data && leads.data.length > 0) {
                                            for (const lead of leads.data) {
                                                const currentRemarks = lead.remarks || '';
                                                let newRemarks = currentRemarks;

                                                if (statusVal === 'delivered' || statusVal === 'read') {
                                                    if (!currentRemarks.includes('[WhatsApp Verified]')) {
                                                        newRemarks = currentRemarks.replace('[WhatsApp Requested]', '').trim();
                                                        newRemarks = (newRemarks.replace('[Not on WhatsApp]', '').trim() + ' [WhatsApp Verified]').trim();
                                                        await LeadService.updateLeadPersonal(lead.id, {
                                                            remarks: newRemarks
                                                        });
                                                        console.log(`✅ CRM UPDATED: Lead ${lead.id} (${lead.firstname}) -> Verified`);
                                                    }
                                                } else if (statusVal === 'failed' && status.errors) {
                                                    const error = status.errors[0];
                                                    if (error.code === 131026 || error.code === 131056) {
                                                        if (!currentRemarks.includes('[Not on WhatsApp]')) {
                                                            newRemarks = currentRemarks.replace('[WhatsApp Requested]', '').trim();
                                                            newRemarks = (newRemarks.replace('[WhatsApp Verified]', '').trim() + ' [Not on WhatsApp]').trim();
                                                            await LeadService.updateLeadPersonal(lead.id, {
                                                                remarks: newRemarks
                                                            });
                                                            console.log(`⚠️ CRM UPDATED: Lead ${lead.id} (${lead.firstname}) -> Not on WhatsApp`);
                                                        }
                                                    }
                                                }
                                            }
                                        } else {
                                            console.warn(`⚠️ Webhook: No lead found in CRM for ${cleanMob}`);
                                        }

                                        // ✅ ALWAYS update the independent status table
                                        let finalStatus = 'Pending';
                                        if (statusVal === 'delivered' || statusVal === 'read') finalStatus = 'Verified';
                                        else if (statusVal === 'failed') {
                                            const err = status.errors?.[0];
                                            if (err?.code === 131026 || err?.code === 131056) finalStatus = 'Not on WhatsApp';
                                            else finalStatus = 'Failed';
                                        }
                                        await updateWhatsAppVerificationStatus(cleanMob, finalStatus, statusVal);
                                    }
                                }
                            }

                            // 2. Handle Incoming Messages
                            if (value.messages) {
                                console.log('📩 Incoming message detected - logged but not processed yet.');
                            }

                            // 3. Handle Template Status Updates
                            if (change.field === 'message_template_status_update') {
                                console.log(`📋 Template Status Update: ${value.message_template_name} [${value.message_template_language}] -> ${value.event}`);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('❌ Webhook Processing Error:', err);
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
};

exports.sendVerification = async (req, res) => {
    const { mobilenumber } = req.body;
    if (!mobilenumber) return res.status(400).json({ error: 'Mobile number is required' });

    try {
        console.log('Verification request for:', mobilenumber);

        // ✅ IDEMPOTENCY GUARD: Check if already requested or verified
        const cleanMob = mobilenumber.replace(/\D/g, '').slice(-10);
        console.log(`🔍 Searching lead by last 10 digits for idempotency: ${cleanMob}`);
        const leads = await LeadService.getLeadPersonalList({ mobilenumber: cleanMob });
        console.log(`📊 Idempotency search for ${cleanMob} found: ${leads.data ? leads.data.length : 0} leads`);

        if (leads.data && leads.data.length > 0) {
            const lead = leads.data[0];
            const remarks = lead.remarks || '';

            if (remarks.includes('[WhatsApp Verified]')) {
                console.log(`ℹ️ Skipping Verification: Lead ${lead.firstname} is already Verified.`);
                return res.json({ success: true, message: 'Number is already verified.', alreadyVerified: true });
            }

            if (remarks.includes('[WhatsApp Requested]')) {
                console.log(`ℹ️ Skipping Verification: OTP was already sent for ${lead.firstname}.`);
                return res.json({ success: true, message: 'Verification is already in progress.', alreadySent: true });
            }
        }

        // Initialize status as 'Requested' in the independent table
        await updateWhatsAppVerificationStatus(mobilenumber, 'Requested');

        console.log('Sending NEW OTP verification to:', mobilenumber);

        // Generate a simple 6-digit OTP for testing
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`🔑 Generated OTP: ${otp}`);

        // Use the proper sendOTP method defined in service, passing the OTP
        const result = await WhatsAppService.sendOTP(mobilenumber, otp);
        console.log('WhatsApp OTP Result:', result);

        // ✅ ADD "Requested" TAG TO LEAD REMARKS
        // Reuse lead object if we found it in the guard above
        if (leads.data && leads.data.length > 0) {
            const lead = leads.data[0];
            const currentRemarks = lead.remarks || '';
            if (!currentRemarks.includes('[WhatsApp Requested]') && !currentRemarks.includes('[WhatsApp Verified]')) {
                const updatedRemarks = (currentRemarks + ' [WhatsApp Requested]').trim();
                await LeadService.updateLeadPersonal(lead.id, {
                    remarks: updatedRemarks
                });
                console.log(`📝 LEAD TAGGED: ${lead.firstname} -> [WhatsApp Requested]`);
            }
        }

        res.json({ success: true, message: 'OTP verification message sent', result, otp });
    } catch (error) {
        console.error('WhatsApp Controller Error:', error.response ? error.response.data : error.message);
        const statusCode = error.response?.status === 401 ? 502 : (error.response?.status || 500);
        res.status(statusCode).json({
            error: error.message,
            details: error.response ? error.response.data : null
        });
    }
};

exports.forceVerify = async (req, res) => {
    const { mobile } = req.params;
    if (!mobile) return res.status(400).send('Mobile number required');

    try {
        const cleanMob = mobile.replace(/\D/g, '').slice(-10);
        console.log(`\n🛠️ MANUAL FORCE VERIFY: ${cleanMob}`);

        const leads = await LeadService.getLeadPersonalList({ mobilenumber: cleanMob });
        if (leads.data && leads.data.length > 0) {
            const lead = leads.data[0];
            const currentRemarks = lead.remarks || '';
            if (!currentRemarks.includes('[WhatsApp Verified]')) {
                const updatedRemarks = (currentRemarks + ' [WhatsApp Verified]').trim();
                await LeadService.updateLeadPersonal(lead.id, { remarks: updatedRemarks });
                return res.send(`✅ SUCCESS: Lead "${lead.firstname}" is now manually verified.`);
            }
            return res.send(`ℹ️ INFO: Lead "${lead.firstname}" was already verified.`);
        }
        return res.status(404).send(`❌ ERROR: No lead found with mobile matching ${cleanMob}`);
    } catch (error) {
        console.error('Force Verify Error:', error);
        res.status(500).send('Error: ' + error.message);
    }
};

exports.sendTemplateMessage = async (req, res) => {
    const { mobilenumber, templateName, components } = req.body;
    if (!mobilenumber || !templateName) {
        return res.status(400).json({ error: 'Mobile number and template name are required' });
    }

    try {
        console.log(`Triggering template "${templateName}" to: ${mobilenumber}`);
        const result = await WhatsAppService.sendTemplateMessage(mobilenumber, templateName, 'en_US', components || []);
        res.json({ success: true, message: 'Template message sent', result });
    } catch (error) {
        console.error('WhatsApp Template Controller Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.message });
    }
};
