import { z } from 'zod';
import { UserRole } from './roles';
export declare const RegisterSchema: z.ZodObject<{
    name: z.ZodDefault<z.ZodString>;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    password: z.ZodString;
    referralCode: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export declare const LoginSchema: z.ZodObject<{
    identifier: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare enum OtpPurpose {
    REGISTRATION = "REGISTRATION",
    LOGIN = "LOGIN",
    PASSWORD_RESET = "PASSWORD_RESET"
}
export declare const VerifyOtpSchema: z.ZodObject<{
    target: z.ZodString;
    code: z.ZodString;
    purpose: z.ZodEnum<typeof OtpPurpose>;
}, z.core.$strip>;
export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;
export declare const ResendOtpSchema: z.ZodObject<{
    target: z.ZodString;
    purpose: z.ZodEnum<typeof OtpPurpose>;
}, z.core.$strip>;
export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;
export declare const ForgotPasswordSchema: z.ZodObject<{
    target: z.ZodString;
}, z.core.$strip>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export declare const ResetPasswordSchema: z.ZodObject<{
    target: z.ZodString;
    code: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export declare const ChangePasswordSchema: z.ZodObject<{
    oldPassword: z.ZodString;
    newPassword: z.ZodString;
}, z.core.$strip>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export interface AuthUser {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    role: UserRole;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isActive: boolean;
    referralCode?: string;
    hasActiveSubscription: boolean;
    subscriptionPlanId?: string;
    subscriptionExpiresAt?: string;
    createdAt: string;
}
export interface AuthResponse {
    user: AuthUser;
    token: string;
    requiresVerification?: boolean;
    verificationTarget?: string;
    verificationPurpose?: OtpPurpose;
    devOtp?: string;
}
