"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBetterAuth = getBetterAuth;
const better_auth_1 = require("better-auth");
const mongodb_1 = require("better-auth/adapters/mongodb");
const plugins_1 = require("better-auth/plugins");
const mongoose_1 = __importDefault(require("mongoose"));
const email_service_1 = require("../services/email.service");
const sms_service_1 = require("../services/sms.service");
const env_1 = require("../config/env");
/**
 * Better Auth Server Configuration
 * Configured with MongoDB adapter, email OTP, phone OTP, and bearer plugins
 */
function getBetterAuth() {
    const dbInstance = mongoose_1.default.connection.getClient().db();
    const secret = env_1.env.BETTER_AUTH_SECRET || env_1.env.JWT_SECRET;
    const baseURL = env_1.env.BETTER_AUTH_URL || env_1.env.BACKEND_URL || `http://localhost:${env_1.env.PORT}`;
    const trustedOrigins = env_1.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
    return (0, better_auth_1.betterAuth)({
        database: (0, mongodb_1.mongodbAdapter)(dbInstance),
        secret,
        baseURL,
        trustedOrigins,
        emailAndPassword: {
            enabled: true,
            requireEmailVerification: false
        },
        plugins: [
            (0, plugins_1.bearer)(),
            (0, plugins_1.emailOTP)({
                expiresIn: 600, // 10 minutes
                sendVerificationOTP: async ({ email, otp }) => {
                    await email_service_1.emailService.sendVerificationOtp(email, otp);
                }
            }),
            (0, plugins_1.phoneNumber)({
                expiresIn: 600, // 10 minutes
                sendOTP: async ({ phoneNumber: targetPhone, code }) => {
                    await sms_service_1.smsService.sendVerificationOtp(targetPhone, code);
                }
            })
        ]
    });
}
//# sourceMappingURL=better-auth.js.map