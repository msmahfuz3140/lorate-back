"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityService = exports.SecurityService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
const OtpVerification_1 = require("../models/OtpVerification");
const Payment_1 = require("../models/Payment");
const ReferralCommission_1 = require("../models/ReferralCommission");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
class SecurityService {
    /**
     * Aggregate platform security overview telemetry
     */
    async getSecurityOverview() {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [blockedCount, suspendedCount, otpAttempts24h, expiredOtps24h, recentAuditLogs, recentFailedPayments, suspiciousReferrals] = await Promise.all([
            User_1.UserModel.countDocuments({ accountStatus: User_1.AccountStatus.BLOCKED }),
            User_1.UserModel.countDocuments({ accountStatus: User_1.AccountStatus.SUSPENDED }),
            OtpVerification_1.OtpVerificationModel.countDocuments({ attempts: { $gte: 3 } }),
            OtpVerification_1.OtpVerificationModel.countDocuments({ expiresAt: { $gte: last24h } }),
            AuditLog_1.AuditLogModel.find({ createdAt: { $gte: last7d } }).sort({ createdAt: -1 }).limit(20),
            Payment_1.PaymentModel.find({ status: { $in: ['FAILED', 'EXPIRED'] }, createdAt: { $gte: last24h } })
                .populate('userId', 'email name')
                .sort({ createdAt: -1 })
                .limit(10),
            ReferralCommission_1.ReferralCommissionModel.find({ status: 'REVERSED' })
                .populate('moderatorId', 'email name')
                .sort({ updatedAt: -1 })
                .limit(10)
        ]);
        return {
            blockedCount,
            suspendedCount,
            otpAttempts24h,
            expiredOtps24h,
            recentAuditLogs,
            recentFailedPayments,
            suspiciousReferrals,
            systemHealth: {
                twoFactorEnforcedForAdmins: true,
                cookieSecurity: 'SameSite=Lax; Secure',
                tokenAlgorithm: 'HS256 (32+ bytes secret)',
                ipnSignatureVerification: 'HMAC-SHA512 TimingSafe'
            }
        };
    }
    /**
     * Fetch active security alerts
     */
    async getSecurityAlerts() {
        const alerts = [];
        const last48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
        // 1. Check for OTP brute force spikes (>= 3 attempts)
        const bruteForceOtps = await OtpVerification_1.OtpVerificationModel.find({
            attempts: { $gte: 3 },
            createdAt: { $gte: last48h }
        }).sort({ createdAt: -1 }).limit(10);
        for (const otp of bruteForceOtps) {
            alerts.push({
                id: `ALERT_OTP_${otp._id}`,
                type: 'OTP_EXHAUSTION_ATTEMPT',
                severity: otp.attempts >= 5 ? 'HIGH' : 'MEDIUM',
                title: `Repeated OTP verification attempts on identifier`,
                identifier: otp.target,
                attempts: otp.attempts,
                createdAt: otp.createdAt,
                description: `Identifier ${otp.target} reached ${otp.attempts} verification attempts.`
            });
        }
        // 2. Check for recent soft-deletions or blocks
        const userAuditAlerts = await AuditLog_1.AuditLogModel.find({
            action: { $in: ['USER_BLOCK', 'USER_SUSPEND', 'USER_SOFT_DELETE', 'DUAL_APPROVAL_CONFIRM'] },
            createdAt: { $gte: last48h }
        }).sort({ createdAt: -1 }).limit(10);
        for (const log of userAuditAlerts) {
            alerts.push({
                id: `ALERT_AUDIT_${log._id}`,
                type: log.action,
                severity: log.action === 'USER_SOFT_DELETE' ? 'HIGH' : 'MEDIUM',
                title: `Administrative Action: ${log.action}`,
                adminEmail: log.adminEmail,
                targetEmail: log.targetUserEmail,
                reason: log.reason,
                createdAt: log.createdAt,
                description: `Admin ${log.adminEmail} triggered ${log.action}. Reason: ${log.reason}`
            });
        }
        return alerts;
    }
    /**
     * Revoke active sessions for a user (forces re-login immediately)
     */
    async revokeUserSessions(adminId, adminEmail, targetUserId, reason) {
        const user = await User_1.UserModel.findById(targetUserId);
        if (!user) {
            throw apiError_1.ApiError.notFound('User not found');
        }
        const revokedAt = new Date();
        user.sessionsRevokedAt = revokedAt;
        await user.save();
        await AuditLog_1.AuditLogModel.create({
            action: 'ADMIN_SETTING_CHANGE',
            adminId: new mongoose_1.default.Types.ObjectId(adminId),
            adminEmail,
            targetUserId: user._id,
            targetUserEmail: user.email,
            reason: reason || 'Administrative session revocation',
            previousValue: { sessionsRevokedAt: user.sessionsRevokedAt },
            newValue: { sessionsRevokedAt: revokedAt }
        }).catch(err => logger_1.logger.error('Audit log failed for session revocation', err));
        logger_1.logger.info(`Active sessions revoked for user ${user.email} by Admin ${adminEmail}`);
        return { success: true, revokedAt };
    }
}
exports.SecurityService = SecurityService;
exports.securityService = new SecurityService();
//# sourceMappingURL=security.service.js.map