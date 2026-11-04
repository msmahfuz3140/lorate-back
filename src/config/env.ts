import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  CORS_ORIGIN: z.string().default('https://lorate-fron.vercel.app,http://localhost:3000,http://localhost:3001'),
  MONGODB_URI: z.string().default('mongodb+srv://rullete-tools:rullete3140@cluster0.8saltut.mongodb.net/roulette-platform?retryWrites=true&w=majority'),
  JWT_SECRET: z.string().default('d94347493f0eb883c58e2a30399d48b1'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BETTER_AUTH_SECRET: z.string().default('4dv3TTs3M3GK1nl9xel6br1Ym5CFyaFN'),
  BETTER_AUTH_URL: z.string().default('https://lorate-back.vercel.app'),
  PUBLIC_WEBSITE_URL: z.string().default('https://lorate-fron.vercel.app'),
  FRONTEND_URL: z.string().default('https://lorate-fron.vercel.app'),
  BACKEND_URL: z.string().default('https://lorate-back.vercel.app'),
  NOWPAYMENTS_API_KEY: z.string().default(''),
  NOWPAYMENTS_IPN_SECRET: z.string().default(''),
  NOWPAYMENTS_API_URL: z.string().default('https://api.nowpayments.io/v1'),
  NOWPAYMENTS_IPN_CALLBACK_URL: z.string().default('https://lorate-back.vercel.app/api/v1/payments/nowpayments/ipn'),
  MAIN_ADMIN_EMAILS: z.string().default('mdmahfuzulhaque3140@gmail.com'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587').transform(Number),
  SMTP_SECURE: z.string().default('false').transform(v => v === 'true' || v === '1'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_PROVIDER_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('Roulette.tools <security@roulette.tools>'),
  SMS_PROVIDER_API_KEY: z.string().default(''),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  LOG_LEVEL: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).default('INFO')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = {
  ...parsed.data,
  MAIN_ADMINS: parsed.data.MAIN_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()),
  PUBLIC_FRONTEND_URL: parsed.data.PUBLIC_WEBSITE_URL || parsed.data.FRONTEND_URL || parsed.data.CORS_ORIGIN.split(',')[0].trim()
};

