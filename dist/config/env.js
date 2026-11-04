"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000').transform(Number),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    MONGODB_URI: zod_1.z.string().default('mongodb://127.0.0.1:27017/roulette-platform'),
    JWT_SECRET: zod_1.z.string().default('dev_jwt_secret_change_in_production_min_32_chars_12345'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    BETTER_AUTH_SECRET: zod_1.z.string().optional(),
    BETTER_AUTH_URL: zod_1.z.string().optional(),
    PUBLIC_WEBSITE_URL: zod_1.z.string().optional(),
    FRONTEND_URL: zod_1.z.string().optional(),
    BACKEND_URL: zod_1.z.string().optional(),
    NOWPAYMENTS_API_KEY: zod_1.z.string().default(''),
    NOWPAYMENTS_IPN_SECRET: zod_1.z.string().default(''),
    NOWPAYMENTS_API_URL: zod_1.z.string().default('https://api.nowpayments.io/v1'),
    NOWPAYMENTS_IPN_CALLBACK_URL: zod_1.z.string().optional(),
    MAIN_ADMIN_EMAILS: zod_1.z.string().default(''),
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.string().default('587').transform(Number),
    SMTP_SECURE: zod_1.z.string().default('false').transform(v => v === 'true' || v === '1'),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    EMAIL_PROVIDER_API_KEY: zod_1.z.string().default(''),
    EMAIL_FROM: zod_1.z.string().default('Roulette.tools <security@roulette.tools>'),
    SMS_PROVIDER_API_KEY: zod_1.z.string().default(''),
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional(),
    TWILIO_AUTH_TOKEN: zod_1.z.string().optional(),
    TWILIO_PHONE_NUMBER: zod_1.z.string().optional(),
    TWILIO_FROM_NUMBER: zod_1.z.string().optional(),
    LOG_LEVEL: zod_1.z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).default('INFO')
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    process.exit(1);
}
exports.env = {
    ...parsed.data,
    MAIN_ADMINS: parsed.data.MAIN_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()),
    PUBLIC_FRONTEND_URL: parsed.data.PUBLIC_WEBSITE_URL || parsed.data.FRONTEND_URL || parsed.data.CORS_ORIGIN.split(',')[0].trim()
};
//# sourceMappingURL=env.js.map