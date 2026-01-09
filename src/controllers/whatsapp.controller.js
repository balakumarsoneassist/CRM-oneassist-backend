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

        const cleanMob = mobilenumber.replace(/\D/g, '').slice(-10);

        // ✅ CHECK STATUS IN TABLE
        const { rows } = await pool.query('SELECT status FROM whatsapp_verification_status WHERE mobilenumber = $1', [cleanMob]);
        const currentStatus = rows[0]?.status;

        if (currentStatus === 'Verified') {
            console.log(`ℹ️ Skipping Verification: Number ${mobilenumber} is already Verified.`);
            return res.json({ success: true, message: 'Number is already verified.', alreadyVerified: true });
        }

        if (currentStatus === 'Requested') {
            // Optional: allow re-sending if it's been a while? For now, simplistic check.
            console.log(`ℹ️ Info: Verification already requested for ${mobilenumber}. Sending another OTP anyway.`);
        }

        // Initialize/Update status as 'Requested' in the independent table
        await updateWhatsAppVerificationStatus(mobilenumber, 'Requested');

        console.log('Sending NEW OTP verification to:', mobilenumber);

        // Generate a simple 6-digit OTP for testing
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`🔑 Generated OTP: ${otp}`);

        // Use the proper sendOTP method defined in service, passing the OTP
        const result = await WhatsAppService.sendOTP(mobilenumber, otp);
        console.log('WhatsApp OTP Result:', result);

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

        await updateWhatsAppVerificationStatus(cleanMob, 'Verified', 'Manual Force Verify');
        return res.send(`✅ SUCCESS: Number ${cleanMob} is now manually marked as Verified.`);

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
        const cleanMob = mobilenumber.replace(/\D/g, '').slice(-10);

        // 1. Check Independent Status Table
        const { rows } = await pool.query('SELECT status FROM whatsapp_verification_status WHERE mobilenumber = $1', [cleanMob]);
        const dbStatus = rows[0]?.status;

        console.log(`🔍 Verification Check for ${mobilenumber} (${cleanMob}):`);
        console.log(`   - DB Status: ${dbStatus}`);

        if (dbStatus !== 'Verified') {
            console.warn(`⚠️ Blocked message to unverified number: ${mobilenumber}`);
            return res.status(400).json({ error: 'Cannot send message: WhatsApp number is not verified.' });
        }

        console.log(`Triggering template "${templateName}" to: ${mobilenumber}`);
        const result = await WhatsAppService.sendTemplateMessage(mobilenumber, templateName, 'en_US', components || []);
        res.json({ success: true, message: 'Template message sent', result });
    } catch (error) {
        console.error('WhatsApp Template Controller Error:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.message });
    }
};
