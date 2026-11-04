"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const apiError_1 = require("../utils/apiError");
class EmailService {
    transporter = null;
    getTransporter() {
        if (this.transporter)
            return this.transporter;
        if (env_1.env.SMTP_HOST && env_1.env.SMTP_USER && env_1.env.SMTP_PASS) {
            try {
                this.transporter = nodemailer_1.default.createTransport({
                    host: env_1.env.SMTP_HOST,
                    port: env_1.env.SMTP_PORT,
                    secure: env_1.env.SMTP_SECURE, // true for 465, false for 587
                    auth: {
                        user: env_1.env.SMTP_USER,
                        pass: env_1.env.SMTP_PASS
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                });
                logger_1.logger.info(`SMTP Transporter initialized for host: ${env_1.env.SMTP_HOST}:${env_1.env.SMTP_PORT}`);
                return this.transporter;
            }
            catch (err) {
                logger_1.logger.error('Failed to initialize SMTP transporter', err);
            }
        }
        return null;
    }
    async sendEmail(options) {
        const { to, subject, text, html } = options;
        // 1. Try Nodemailer SMTP if configured
        const transporter = this.getTransporter();
        if (transporter && env_1.env.SMTP_USER) {
            try {
                const fromAddress = env_1.env.EMAIL_FROM || `Roulette.tools <${env_1.env.SMTP_USER}>`;
                const info = await transporter.sendMail({
                    from: fromAddress,
                    to,
                    subject,
                    text,
                    html: html || text
                });
                logger_1.logger.info(`Email successfully dispatched via SMTP to: ${to} (MessageId: ${info.messageId})`);
                return true;
            }
            catch (smtpErr) {
                logger_1.logger.error(`SMTP delivery error sending to ${to}:`, smtpErr);
                if (env_1.env.NODE_ENV === 'production' && !env_1.env.EMAIL_PROVIDER_API_KEY) {
                    throw apiError_1.ApiError.internal('SMTP delivery failed. Please verify email configuration.');
                }
            }
        }
        // 2. Check if configured for external API provider (e.g. Resend)
        if (env_1.env.EMAIL_PROVIDER_API_KEY && env_1.env.EMAIL_PROVIDER_API_KEY.trim() !== '') {
            try {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${env_1.env.EMAIL_PROVIDER_API_KEY}`
                    },
                    body: JSON.stringify({
                        from: env_1.env.EMAIL_FROM || 'Roulette.tools <security@roulette.tools>',
                        to: [to],
                        subject,
                        text,
                        html: html || text
                    })
                });
                if (!response.ok) {
                    const errData = await response.text();
                    logger_1.logger.error('Email delivery provider returned error', new Error(errData), { to, status: response.status });
                    throw apiError_1.ApiError.internal('Failed to dispatch verification email from provider');
                }
                logger_1.logger.info(`Email successfully dispatched via provider API to: ${to}`, { subject });
                return true;
            }
            catch (error) {
                logger_1.logger.error(`Email dispatch error to: ${to}`, error);
                if (env_1.env.NODE_ENV === 'production') {
                    throw apiError_1.ApiError.internal('Email service error. Verification code could not be sent.');
                }
            }
        }
        // 3. In development or test mode (or when SMTP credentials haven't been added yet): Safe local simulation
        logger_1.logger.info(`📧 [EMAIL NOTIFICATION] (Target: ${to})`);
        logger_1.logger.info(`Subject: ${subject}`);
        logger_1.logger.info(`Content:\n${text}`);
        if (!env_1.env.SMTP_USER && env_1.env.NODE_ENV === 'production') {
            logger_1.logger.warn('SMTP credentials not configured in production. Add SMTP_USER and SMTP_PASS in .env to dispatch live emails.');
        }
        return true;
    }
    async sendVerificationOtp(to, code, name) {
        const greeting = name ? `Hello ${name},` : 'Hello,';
        const text = `${greeting}\n\nYour Roulette.tools account verification code is: ${code}\n\nThis code will expire in 10 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nThe Roulette.tools Security Team`;
        const html = `
      <div style="background-color: #0c1017; color: #f8fafc; font-family: sans-serif; padding: 30px; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid rgba(245,158,11,0.2);">
        <h2 style="color: #f59e0b; margin-top: 0;">Roulette.tools Verification</h2>
        <p>${greeting}</p>
        <p>Use the 6-digit one-time code below to verify your email address:</p>
        <div style="background-color: #161e2e; border: 1px solid rgba(255,255,255,0.1); padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #10b981;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">This code expires in 10 minutes. Do not share this code with anyone.</p>
      </div>
    `;
        return this.sendEmail({
            to,
            subject: `Your Roulette.tools Verification Code: ${code}`,
            text,
            html
        });
    }
    async sendPasswordResetOtp(to, code) {
        const text = `Hello,\n\nA password reset request was received for your Roulette.tools account.\n\nYour reset code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not request a password reset, please secure your account immediately.`;
        return this.sendEmail({
            to,
            subject: `Roulette.tools Password Reset Code: ${code}`,
            text
        });
    }
    async sendVipSecretCodeEmail(options) {
        const { to, name, planName, durationDays, secretCode } = options;
        const greeting = name ? `Hello ${name},` : 'Hello,';
        const subject = `🎉 Congratulations! Your VIP Tool Secret Activation Code: ${secretCode}`;
        const text = `${greeting}\n\nCongratulations! Your VIP Subscription purchase has been verified and approved by administration.\n\nPlan: ${planName} (${durationDays} Days Active Access)\n\nYOUR SECRET ACTIVATION CODE:\n${secretCode}\n\nTo unlock the tool:\n1. Log in to your Roulette.tools account\n2. Open your Member Dashboard or Tool page\n3. Enter your Secret Code when prompted\n\nBest regards,\nThe Roulette.tools Team`;
        const html = `
      <div style="background-color: #06080d; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid rgba(245,158,11,0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 1px;">ROULETTE.TOOLS</h1>
          <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; margin-top: 4px; letter-spacing: 2px;">European Roulette Intelligence</p>
        </div>
        <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; text-align: center;">
          <span style="color: #10b981; font-weight: bold; font-size: 13px;">✓ VIP Subscription Approved & Confirmed</span>
        </div>
        <p style="font-size: 15px; color: #f8fafc;">${greeting}</p>
        <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">Congratulations! Your VIP Pass has been verified and approved. Your account is now granted access to the European Roulette live prediction tool.</p>
        <div style="background: linear-gradient(135deg, #0e1422, #141d30); border: 1px solid rgba(245,158,11,0.3); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">Your Secret Activation Code</span>
          <span style="font-size: 30px; font-weight: 900; letter-spacing: 6px; color: #f59e0b; font-family: monospace; display: block;">${secretCode}</span>
          <span style="color: #64748b; font-size: 11px; display: block; margin-top: 8px;">Plan: ${planName} • Valid for ${durationDays} Days</span>
        </div>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
          <strong>How to unlock the tool:</strong><br/>
          1. Go to your <a href="http://localhost:3000/dashboard" style="color: #f59e0b; text-decoration: underline;">Member Dashboard</a> or Tool page.<br/>
          2. Enter the <strong>Secret Activation Code</strong> above in the prompt.<br/>
          3. Enjoy real-time algorithmic prediction across all 20+ live Evolution & Pragmatic tables!
        </p>
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;" />
        <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">Do not share this Secret Code. Roulette.tools Security Team</p>
      </div>
    `;
        return this.sendEmail({
            to,
            subject,
            text,
            html
        });
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=email.service.js.map