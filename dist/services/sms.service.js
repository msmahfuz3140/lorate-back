"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsService = exports.SmsService = void 0;
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const apiError_1 = require("../utils/apiError");
const phone_1 = require("../utils/phone");
class SmsService {
    async sendSms(to, message) {
        if (!(0, phone_1.isValidE164)(to)) {
            throw apiError_1.ApiError.badRequest('Phone number must be in international E.164 format (e.g. +14155552671)');
        }
        // Check if configured for Twilio SMS provider
        const twilioSid = env_1.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID;
        const twilioAuth = env_1.env.TWILIO_AUTH_TOKEN || env_1.env.SMS_PROVIDER_API_KEY || process.env.TWILIO_AUTH_TOKEN || process.env.SMS_PROVIDER_API_KEY;
        const twilioFrom = env_1.env.TWILIO_PHONE_NUMBER || env_1.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER;
        if (twilioSid && twilioAuth && twilioSid.trim() !== '' && twilioAuth.trim() !== '') {
            try {
                const authString = Buffer.from(`${twilioSid.trim()}:${twilioAuth.trim()}`).toString('base64');
                const params = new URLSearchParams();
                params.append('To', to);
                params.append('From', twilioFrom || '+15005550006');
                params.append('Body', message);
                const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${authString}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: params.toString()
                });
                if (!response.ok) {
                    const errText = await response.text();
                    logger_1.logger.error('Twilio SMS provider returned error', new Error(errText), { to, status: response.status });
                    throw apiError_1.ApiError.internal('Failed to dispatch SMS verification code from provider');
                }
                logger_1.logger.info(`SMS successfully dispatched via Twilio to: ${to}`);
                return true;
            }
            catch (error) {
                logger_1.logger.error(`SMS dispatch error to: ${to}`, error);
                if (env_1.env.NODE_ENV === 'production') {
                    throw apiError_1.ApiError.internal('SMS provider error. Verification code could not be sent.');
                }
            }
        }
        // In development or test mode (or when Twilio credentials are pending): Safe simulation
        logger_1.logger.info(`📱 [SMS NOTIFICATION] (Target: ${to})`);
        logger_1.logger.info(`Message: ${message}`);
        if (!twilioSid && env_1.env.NODE_ENV === 'production') {
            logger_1.logger.warn('Twilio credentials not configured in production. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env to dispatch live SMS.');
        }
        return true;
    }
    async sendVerificationOtp(to, code) {
        const text = `[Roulette.tools] Your verification code is: ${code}. Valid for 10 minutes.`;
        return this.sendSms(to, text);
    }
    async sendPasswordResetOtp(to, code) {
        const text = `[Roulette.tools] Your password reset code is: ${code}. Valid for 10 minutes.`;
        return this.sendSms(to, text);
    }
}
exports.SmsService = SmsService;
exports.smsService = new SmsService();
//# sourceMappingURL=sms.service.js.map