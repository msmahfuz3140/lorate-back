"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangePasswordSchema = exports.ResetPasswordSchema = exports.ForgotPasswordSchema = exports.ResendOtpSchema = exports.VerifyOtpSchema = exports.OtpPurpose = exports.LoginSchema = exports.RegisterSchema = void 0;
const zod_1 = require("zod");
exports.RegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters long').default('Member'),
    email: zod_1.z.string().email('Invalid email address format').optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().min(8, 'Phone number must be at least 8 digits').optional().or(zod_1.z.literal('')),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
    referralCode: zod_1.z.string().optional()
}).refine(data => (data.email && data.email.trim() !== '') || (data.phone && data.phone.trim() !== ''), {
    message: 'Either a valid email address or phone number is required'
});
exports.LoginSchema = zod_1.z.object({
    identifier: zod_1.z.string().min(3, 'Email or phone number is required'),
    password: zod_1.z.string().min(6, 'Password is required')
});
var OtpPurpose;
(function (OtpPurpose) {
    OtpPurpose["REGISTRATION"] = "REGISTRATION";
    OtpPurpose["LOGIN"] = "LOGIN";
    OtpPurpose["PASSWORD_RESET"] = "PASSWORD_RESET";
})(OtpPurpose || (exports.OtpPurpose = OtpPurpose = {}));
exports.VerifyOtpSchema = zod_1.z.object({
    target: zod_1.z.string().min(3, 'Target email or phone is required'),
    code: zod_1.z.string().length(6, 'Verification code must be exactly 6 digits'),
    purpose: zod_1.z.nativeEnum(OtpPurpose)
});
exports.ResendOtpSchema = zod_1.z.object({
    target: zod_1.z.string().min(3, 'Target email or phone is required'),
    purpose: zod_1.z.nativeEnum(OtpPurpose)
});
exports.ForgotPasswordSchema = zod_1.z.object({
    target: zod_1.z.string().min(3, 'Email or phone number is required')
});
exports.ResetPasswordSchema = zod_1.z.object({
    target: zod_1.z.string().min(3, 'Target email or phone is required'),
    code: zod_1.z.string().length(6, 'Verification code must be 6 digits'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters long')
});
exports.ChangePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters long')
});
//# sourceMappingURL=auth.js.map