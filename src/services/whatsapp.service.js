const axios = require('axios');
const pool = require('../db/index');

class WhatsAppService {
    constructor() {
        // Greedy manual .env read to bypass potential dotenv parsing/truncation issues
        let rawToken = process.env.WHATSAPP_TOKEN;
        let rawPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        try {
            const fs = require('fs');
            const path = require('path');
            const envPath = path.join(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                const env = fs.readFileSync(envPath, 'utf8');
                const lines = env.split(/\r?\n/);
                lines.forEach(line => {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('WHATSAPP_TOKEN=')) {
                        // Extract everything after the first '='
                        rawToken = line.substring(line.indexOf('=') + 1).split('#')[0].trim();
                    } else if (trimmedLine.startsWith('WHATSAPP_PHONE_NUMBER_ID=')) {
                        rawPhoneId = line.substring(line.indexOf('=') + 1).split('#')[0].trim();
                    }
                });
            }
        } catch (e) {
            console.warn('⚠️ WhatsAppService: Manual .env read fallback failed:', e.message);
        }

        const cleanEnv = (val) => val?.replace(/\s/g, '')?.replace(/^["']|["']$/g, '');

        this.token = cleanEnv(rawToken);
        this.phoneNumberId = cleanEnv(rawPhoneId);
        this.baseUrl = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;

        this.templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'verification';

        if (!this.token) {
            console.error('❌ WhatsAppService: WHATSAPP_TOKEN is missing!');
        } else {
            console.log(`✅ WhatsAppService: Token initialized (length: ${this.token.length})`);
        }

        if (!this.phoneNumberId) {
            console.error('❌ WhatsAppService: WHATSAPP_PHONE_NUMBER_ID is missing!');
        } else {
            console.log(`✅ WhatsAppService: Phone Number ID initialized: ${this.phoneNumberId}`);
        }

        console.log(`✅ WhatsAppService: Using template: ${this.templateName}`);
    }

    async sendTemplateMessage(to, templateName, languageCode = 'en_US', components = []) {
        try {
            // Clean the 'to' number - remove non-digits
            let cleanTo = to.replace(/\D/g, '');

            // Verification Check (Centralized)
            // Skip check only if template is 'verification' (OTP flow)
            if (templateName !== 'verification') {
                try {
                    const checkMob = cleanTo.slice(-10); // Check based on last 10 digits
                    const { rows } = await pool.query('SELECT status FROM whatsapp_verification_status WHERE mobilenumber = $1', [checkMob]);
                    const dbStatus = rows[0]?.status;

                    if (dbStatus !== 'Verified') {
                        console.warn(`🛑 BLOCKED: Attempt to send "${templateName}" to unverified number: ${to} (Status: ${dbStatus})`);
                        // Throwing error to stop execution
                        throw new Error(`WhatsApp messaging blocked: Number ${to} is not verified.`);
                    }
                } catch (dbErr) {
                    if (dbErr.message.includes('WhatsApp messaging blocked')) throw dbErr;
                    console.error('⚠️ Verification check failed (DB error), proceeding with caution:', dbErr);
                }
            }

            // If the number doesn't start with a country code (91 in this case) and is 10 digits
            // or if it's just missing the country code, prepend it.
            if (cleanTo.length === 10) {
                console.log(`Adding +91 prefix to 10-digit number: ${cleanTo}`);
                cleanTo = '91' + cleanTo;
            } else if (cleanTo.length > 10 && !cleanTo.startsWith('91')) {
                // If it's more than 10 but doesn't start with 91, assume it needs it (specific for this context)
                console.log(`Prepending 91 to number: ${cleanTo}`);
                cleanTo = '91' + cleanTo;
            }
            console.log(`Sending to cleaned number: ${cleanTo}`);

            // ✅ FIX #2: Explicit validation instead of silent override
            const ALLOWED_TEMPLATES = [
                'verification',
                'appointment_date',
                'document_collection',
                'document_rejected',
                'file_login',
                'hello_world'
            ];

            if (!ALLOWED_TEMPLATES.includes(templateName)) {
                console.warn(`⚠️ Warning: Template "${templateName}" is not in the allowed list.`);
                // If it's one of our expected CRM templates, allow it but log a warning
                // Otherwise, you might want to throw an error as suggested in your feedback
            }

            // ✅ PREVENT 400 ERROR: If templates are static in Meta, they MUST NOT have components.
            // Static (0 params): verification, document_rejected, file_login, hello_world
            const staticTemplates = ['verification', 'document_rejected', 'file_login', 'hello_world'];
            const activeComponents = staticTemplates.includes(templateName) ? [] : components;

            if (components.length > 0 && activeComponents.length === 0) {
                console.log(`⚠️ Note: Stripping components for static template "${templateName}" to prevent 400 error.`);
            }

            const requestBody = {
                messaging_product: 'whatsapp',
                to: cleanTo,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode
                    },
                    components: activeComponents
                }
            };

            console.log('\n=========================================');
            console.log('🚀 WHATSAPP TEMPLATE DISPATCH - JAN 02');
            console.log('Template:', templateName);
            console.log('Components:', JSON.stringify(components, null, 2));
            console.log('=========================================\n');

            console.log('--- WhatsApp API Request ---');
            console.log('URL:', this.baseUrl);
            console.log('Body:', JSON.stringify(requestBody, null, 2));

            const response = await axios.post(this.baseUrl, requestBody, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('WhatsApp Template Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async sendServiceMessage(to, text) {
        try {
            const cleanTo = to.replace(/\D/g, '');

            try {
                const checkMob = cleanTo.slice(-10);
                const { rows } = await pool.query('SELECT status FROM whatsapp_verification_status WHERE mobilenumber = $1', [checkMob]);
                const dbStatus = rows[0]?.status;

                if (dbStatus !== 'Verified') {
                    console.warn(`🛑 BLOCKED: Attempt to send Service Message to unverified number: ${to}`);
                    throw new Error(`WhatsApp messaging blocked: Number ${to} is not verified.`);
                }
            } catch (dbErr) {
                if (dbErr.message.includes('WhatsApp messaging blocked')) throw dbErr;
                console.error('⚠️ Verification check failed (DB error), proceeding with caution:', dbErr);
            }

            const response = await axios.post(this.baseUrl, {
                messaging_product: 'whatsapp',
                to: cleanTo,
                type: 'text',
                text: { body: text }
            }, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error) {
            console.error('WhatsApp Service Message Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }

    async sendOTP(to, otp) {
        // As requested: The "Verify" button uses the 'verification' template which has 0 params
        const targetTemplate = 'verification';

        // Sending with empty components because 'verification' is static (0 parameters)
        return this.sendTemplateMessage(to, targetTemplate, 'en_US', []);
    }
}

module.exports = new WhatsAppService();
