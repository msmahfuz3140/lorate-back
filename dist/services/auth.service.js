"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const user_repository_1 = require("../repositories/user.repository");
const subscription_repository_1 = require("../repositories/subscription.repository");
const OtpVerification_1 = require("../models/OtpVerification");
const AuditLog_1 = require("../models/AuditLog");
const User_1 = require("../models/User");
const crypto_2 = require("../utils/crypto");
const phone_1 = require("../utils/phone");
const email_service_1 = require("./email.service");
const sms_service_1 = require("./sms.service");
const apiError_1 = require("../utils/apiError");
const auth_1 = require("../shared/auth");
const roles_1 = require("../shared/roles");
const logger_1 = require("../utils/logger");
class AuthService {
    hashOtp(code) {
        return crypto_1.default.createHash('sha256').update(code.trim()).digest('hex');
    }
    async register(input, ip) {
        const { name, email, phone, password, referralCode } = input;
        let normalizedEmail;
        let normalizedPhone;
        if (email && email.trim() !== '') {
            normalizedEmail = email.toLowerCase().trim();
        }
        if (phone && phone.trim() !== '') {
            try {
                normalizedPhone = (0, phone_1.normalizePhoneNumber)(phone);
            }
            catch (err) {
                throw apiError_1.ApiError.badRequest(err.message || 'Invalid phone number');
            }
        }
        // Check optional referral code with fraud & validity checks
        let referredById;
        let referredAt;
        let referralCodeUsed;
        if (referralCode && referralCode.trim() !== '') {
            const cleanCode = referralCode.trim();
            const referrer = await user_repository_1.userRepository.findByReferralCode(cleanCode);
            if (referrer) {
                // 1. Only active Moderators generate qualifying referral attribution
                if (referrer.role !== roles_1.UserRole.MODERATOR) {
                    logger_1.logger.warn(`Referral rejected: Referrer ${referrer._id} does not have MODERATOR role.`);
                }
                else if (referrer.accountStatus !== User_1.AccountStatus.ACTIVE || !referrer.isActive || referrer.isDeleted) {
                    logger_1.logger.warn(`Referral rejected: Moderator ${referrer._id} is inactive, suspended, or blocked.`);
                }
                else {
                    // 2. Self-referral prevention
                    const isSelfEmail = normalizedEmail && referrer.email && (normalizedEmail === referrer.email ||
                        normalizedEmail.replace(/\+.*@/, '@') === referrer.email.replace(/\+.*@/, '@'));
                    const isSelfPhone = normalizedPhone && referrer.phone && normalizedPhone === referrer.phone;
                    if (isSelfEmail || isSelfPhone) {
                        logger_1.logger.warn(`Referral fraud flag: Self-referral attempt detected for moderator ${referrer._id}`);
                        await AuditLog_1.AuditLogModel.create({
                            action: 'REFERRAL_FRAUD_FLAG',
                            adminId: referrer._id,
                            adminEmail: referrer.email || 'moderator@roulette.tools',
                            reason: 'Self-referral attempt detected during account registration',
                            details: {
                                referralCode: cleanCode,
                                moderatorId: referrer._id.toString(),
                                candidateEmail: normalizedEmail,
                                candidatePhone: normalizedPhone
                            }
                        }).catch(err => logger_1.logger.error('Failed to log referral fraud audit', err));
                    }
                    else {
                        // Valid attribution
                        referredById = referrer._id.toString();
                        referredAt = new Date();
                        referralCodeUsed = cleanCode;
                    }
                }
            }
        }
        // Duplicate account conflict checks
        if (normalizedEmail) {
            const existingEmail = await user_repository_1.userRepository.findByEmail(normalizedEmail);
            if (existingEmail) {
                throw apiError_1.ApiError.conflict('An account with this email address already exists');
            }
        }
        if (normalizedPhone) {
            const existingPhone = await user_repository_1.userRepository.findByPhone(normalizedPhone);
            if (existingPhone) {
                throw apiError_1.ApiError.conflict('An account with this phone number already exists');
            }
        }
        // Never allow public registration to assign SUPER_ADMIN or MODERATOR
        const role = roles_1.UserRole.USER;
        const passwordHash = await (0, crypto_2.hashPassword)(password);
        const newReferralCode = (0, crypto_2.generateRandomString)(8).toUpperCase();
        const user = await user_repository_1.userRepository.create({
            name: name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            passwordHash,
            role,
            isEmailVerified: false,
            isPhoneVerified: false,
            referralCode: newReferralCode,
            referredBy: referredById,
            referredAt,
            referralCodeUsed
        });
        if (referredById) {
            await AuditLog_1.AuditLogModel.create({
                action: 'REFERRAL_ATTRIBUTION',
                adminId: referredById,
                adminEmail: 'attribution@system.roulette.tools',
                targetUserId: user._id,
                targetUserEmail: user.email || user.phone,
                reason: 'Customer successfully attributed to Moderator via valid referral link',
                details: {
                    moderatorId: referredById,
                    referralCode: referralCodeUsed,
                    customerId: user._id.toString()
                }
            }).catch(err => logger_1.logger.error('Failed to log referral attribution audit', err));
        }
        // Generate initial OTP code
        const target = normalizedEmail || normalizedPhone;
        const rawOtp = (0, crypto_2.generateOtpCode)(6);
        const codeHash = this.hashOtp(rawOtp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await OtpVerification_1.OtpVerificationModel.create({
            target: target.toLowerCase(),
            codeHash,
            rawCodeDev: env_1.env.NODE_ENV === 'development' ? rawOtp : undefined,
            purpose: auth_1.OtpPurpose.REGISTRATION,
            expiresAt,
            lastSentAt: new Date(),
            ip
        });
        // Dispatch OTP via appropriate delivery provider
        if (normalizedEmail) {
            await email_service_1.emailService.sendVerificationOtp(normalizedEmail, rawOtp, user.name);
        }
        else {
            await sms_service_1.smsService.sendVerificationOtp(normalizedPhone, rawOtp);
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id.toString() }, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN
        });
        return {
            user: this.mapToAuthUser(user, false),
            token,
            requiresVerification: true,
            verificationTarget: target,
            verificationPurpose: auth_1.OtpPurpose.REGISTRATION,
            ...(env_1.env.NODE_ENV === 'development' ? { devOtp: rawOtp } : {})
        };
    }
    async login(input) {
        const { identifier, password } = input;
        const cleanId = identifier.trim();
        // Check if identifier is phone number
        let lookupTarget = cleanId;
        if (!cleanId.includes('@')) {
            try {
                lookupTarget = (0, phone_1.normalizePhoneNumber)(cleanId);
            }
            catch {
                // Fallback to literal search if normalization fails
                lookupTarget = cleanId;
            }
        }
        const user = await user_repository_1.userRepository.findByIdentifier(lookupTarget, cleanId);
        if (!user) {
            throw apiError_1.ApiError.unauthorized('Invalid email/phone or password');
        }
        const isMatch = await (0, crypto_2.comparePassword)(password, user.passwordHash);
        if (!isMatch) {
            throw apiError_1.ApiError.unauthorized('Invalid email/phone or password');
        }
        // Update last login
        user.lastLoginAt = new Date();
        await user.save();
        const activeSub = await subscription_repository_1.subscriptionRepository.findActiveByUserId(user._id);
        const isVerified = user.isEmailVerified || user.isPhoneVerified;
        const token = jsonwebtoken_1.default.sign({ userId: user._id.toString() }, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN
        });
        return {
            user: this.mapToAuthUser(user, !!activeSub),
            token,
            requiresVerification: !isVerified,
            verificationTarget: user.email || user.phone,
            verificationPurpose: !isVerified ? auth_1.OtpPurpose.REGISTRATION : undefined
        };
    }
    async verifyOtp(input) {
        const { target, code, purpose } = input;
        const cleanTarget = target.toLowerCase().trim();
        const now = new Date();
        const record = await OtpVerification_1.OtpVerificationModel.findOne({
            target: cleanTarget,
            purpose,
            isUsed: false,
            expiresAt: { $gt: now }
        }).sort({ createdAt: -1 });
        if (!record) {
            throw apiError_1.ApiError.badRequest('Invalid or expired verification code. Please request a new one.');
        }
        // Enforce max verification attempts
        if (record.attempts >= 5) {
            record.isUsed = true;
            await record.save();
            throw apiError_1.ApiError.badRequest('Maximum verification attempts exceeded. Code has been invalidated. Please request a new code.');
        }
        const providedHash = this.hashOtp(code);
        const isDevMatch = env_1.env.NODE_ENV === 'development' && (code === '314031' || code === '123456');
        if (record.codeHash !== providedHash && !isDevMatch) {
            record.attempts += 1;
            await record.save();
            const remaining = 5 - record.attempts;
            throw apiError_1.ApiError.badRequest(`Incorrect verification code. ${remaining} attempt(s) remaining.`);
        }
        // Mark as consumed immediately (Single-use enforcement)
        record.isUsed = true;
        await record.save();
        // Activate and verify user
        const user = await user_repository_1.userRepository.findByIdentifier(cleanTarget);
        if (!user) {
            throw apiError_1.ApiError.notFound('Account associated with this verification target was not found.');
        }
        const isEmail = cleanTarget.includes('@');
        user.isActive = true;
        if (isEmail) {
            user.isEmailVerified = true;
        }
        else {
            user.isPhoneVerified = true;
        }
        await user.save();
        const activeSub = await subscription_repository_1.subscriptionRepository.findActiveByUserId(user._id);
        const token = jsonwebtoken_1.default.sign({ userId: user._id.toString() }, env_1.env.JWT_SECRET, {
            expiresIn: env_1.env.JWT_EXPIRES_IN
        });
        return {
            user: this.mapToAuthUser(user, !!activeSub),
            token,
            requiresVerification: false
        };
    }
    async resendOtp(input, ip) {
        const { target, purpose } = input;
        const cleanTarget = target.toLowerCase().trim();
        const now = new Date();
        // Check cooldown from latest record (60 seconds minimum)
        const latest = await OtpVerification_1.OtpVerificationModel.findOne({
            target: cleanTarget,
            purpose
        }).sort({ createdAt: -1 });
        if (latest && latest.lastSentAt) {
            const elapsedMs = now.getTime() - new Date(latest.lastSentAt).getTime();
            const cooldownMs = 60 * 1000;
            if (elapsedMs < cooldownMs) {
                const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
                throw apiError_1.ApiError.badRequest(`Please wait ${remainingSeconds} seconds before requesting a new verification code.`);
            }
        }
        // Invalidate prior unused codes for this target and purpose
        await OtpVerification_1.OtpVerificationModel.updateMany({ target: cleanTarget, purpose, isUsed: false }, { $set: { isUsed: true } });
        const rawOtp = (0, crypto_2.generateOtpCode)(6);
        const codeHash = this.hashOtp(rawOtp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await OtpVerification_1.OtpVerificationModel.create({
            target: cleanTarget,
            codeHash,
            rawCodeDev: env_1.env.NODE_ENV === 'development' ? rawOtp : undefined,
            purpose,
            expiresAt,
            lastSentAt: now,
            ip
        });
        if (cleanTarget.includes('@')) {
            await email_service_1.emailService.sendVerificationOtp(cleanTarget, rawOtp);
        }
        else {
            await sms_service_1.smsService.sendVerificationOtp(cleanTarget, rawOtp);
        }
        return { success: true, cooldownSeconds: 60 };
    }
    async forgotPassword(input, ip) {
        const cleanTarget = input.target.toLowerCase().trim();
        const user = await user_repository_1.userRepository.findByIdentifier(cleanTarget);
        // Generic response to prevent account enumeration
        if (!user) {
            return { message: 'If an account exists with this email or phone number, a verification code has been dispatched.' };
        }
        // Invalidate prior unused reset codes
        await OtpVerification_1.OtpVerificationModel.updateMany({ target: cleanTarget, purpose: auth_1.OtpPurpose.PASSWORD_RESET, isUsed: false }, { $set: { isUsed: true } });
        const rawOtp = (0, crypto_2.generateOtpCode)(6);
        const codeHash = this.hashOtp(rawOtp);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await OtpVerification_1.OtpVerificationModel.create({
            target: cleanTarget,
            codeHash,
            rawCodeDev: env_1.env.NODE_ENV === 'development' ? rawOtp : undefined,
            purpose: auth_1.OtpPurpose.PASSWORD_RESET,
            expiresAt,
            lastSentAt: new Date(),
            ip
        });
        if (cleanTarget.includes('@')) {
            await email_service_1.emailService.sendPasswordResetOtp(cleanTarget, rawOtp);
        }
        else {
            await sms_service_1.smsService.sendPasswordResetOtp(cleanTarget, rawOtp);
        }
        return { message: 'If an account exists with this email or phone number, a verification code has been dispatched.' };
    }
    async resetPassword(input) {
        const { target, code, newPassword } = input;
        const cleanTarget = target.toLowerCase().trim();
        const now = new Date();
        const record = await OtpVerification_1.OtpVerificationModel.findOne({
            target: cleanTarget,
            purpose: auth_1.OtpPurpose.PASSWORD_RESET,
            isUsed: false,
            expiresAt: { $gt: now }
        }).sort({ createdAt: -1 });
        if (!record) {
            throw apiError_1.ApiError.badRequest('Invalid or expired password reset code.');
        }
        if (record.attempts >= 5) {
            record.isUsed = true;
            await record.save();
            throw apiError_1.ApiError.badRequest('Maximum attempts exceeded. Please request a new password reset code.');
        }
        const providedHash = this.hashOtp(code);
        if (record.codeHash !== providedHash) {
            record.attempts += 1;
            await record.save();
            throw apiError_1.ApiError.badRequest('Incorrect verification code.');
        }
        record.isUsed = true;
        await record.save();
        const user = await user_repository_1.userRepository.findByIdentifier(cleanTarget);
        if (!user) {
            throw apiError_1.ApiError.notFound('Account not found.');
        }
        user.passwordHash = await (0, crypto_2.hashPassword)(newPassword);
        await user.save();
        return { success: true, message: 'Password has been successfully reset. You can now login.' };
    }
    async changePassword(userId, input) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw apiError_1.ApiError.unauthorized('User not found.');
        }
        const isMatch = await (0, crypto_2.comparePassword)(input.oldPassword, user.passwordHash);
        if (!isMatch) {
            throw apiError_1.ApiError.badRequest('Current password is incorrect.');
        }
        user.passwordHash = await (0, crypto_2.hashPassword)(input.newPassword);
        await user.save();
        return { success: true };
    }
    async updateProfile(userId, input) {
        const user = await user_repository_1.userRepository.findById(userId);
        if (!user) {
            throw apiError_1.ApiError.unauthorized('User not found.');
        }
        if (input.name !== undefined) {
            const cleanName = input.name.trim();
            if (!cleanName || cleanName.length < 2) {
                throw apiError_1.ApiError.badRequest('Name must be at least 2 characters long.');
            }
            user.name = cleanName;
        }
        if (input.phone !== undefined) {
            const cleanPhone = input.phone.trim();
            if (cleanPhone && cleanPhone !== user.phone) {
                let normalizedPhone = cleanPhone;
                try {
                    normalizedPhone = (0, phone_1.normalizePhoneNumber)(cleanPhone);
                }
                catch {
                    normalizedPhone = cleanPhone;
                }
                const existing = await user_repository_1.userRepository.findByPhone(normalizedPhone);
                if (existing && existing._id.toString() !== user._id.toString()) {
                    throw apiError_1.ApiError.badRequest('Phone number is already associated with another account.');
                }
                user.phone = normalizedPhone;
            }
        }
        await user.save();
        const activeSub = await subscription_repository_1.subscriptionRepository.findActiveByUserId(user._id);
        return this.mapToAuthUser(user, !!activeSub);
    }
    mapToAuthUser(user, hasActiveSub) {
        return {
            id: user._id.toString(),
            name: user.name || 'Member',
            email: user.email,
            phone: user.phone,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            isActive: user.isActive,
            referralCode: user.referralCode,
            hasActiveSubscription: hasActiveSub || user.role === roles_1.UserRole.SUPER_ADMIN || user.role === roles_1.UserRole.MODERATOR,
            createdAt: user.createdAt.toISOString()
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map