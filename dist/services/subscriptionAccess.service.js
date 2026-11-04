"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionAccessService = exports.SubscriptionAccessService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Subscription_1 = require("../models/Subscription");
const User_1 = require("../models/User");
const Plan_1 = require("../models/Plan");
const roles_1 = require("../shared/roles");
const subscriptions_1 = require("../shared/subscriptions");
const plans_1 = require("../shared/plans");
const subscription_service_1 = require("./subscription.service");
const notification_service_1 = require("./notification.service");
const ToolSettings_1 = require("../models/ToolSettings");
const AuditLog_1 = require("../models/AuditLog");
const email_service_1 = require("./email.service");
const crypto_1 = require("../utils/crypto");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
class SubscriptionAccessService {
    /**
     * Authoritative server-side subscription validation.
     * Evaluates user role, subscription status, start/end date boundaries, and revocation status.
     * When a subscription is past its expiry date, dynamically updates database status to EXPIRED.
     */
    async checkAccess(userId) {
        const user = await User_1.UserModel.findById(userId);
        if (!user) {
            return {
                hasAccess: false,
                code: 'UNAUTHENTICATED',
                reason: 'User account not found'
            };
        }
        // Check Global Tool Operational Settings & Maintenance Mode
        if (mongoose_1.default.connection.readyState === 1) {
            const toolSettings = await ToolSettings_1.ToolSettingsModel.getSettings();
            if (!toolSettings.isToolEnabled) {
                return {
                    hasAccess: false,
                    code: 'TOOL_DISABLED',
                    reason: toolSettings.publicStatusMessage || 'The prediction engine is currently disabled by system administration.'
                };
            }
            if (toolSettings.maintenanceMode && user.role !== roles_1.UserRole.SUPER_ADMIN) {
                return {
                    hasAccess: false,
                    code: 'TOOL_MAINTENANCE',
                    reason: toolSettings.publicStatusMessage || 'Scheduled system maintenance is currently underway. Please check back shortly.'
                };
            }
        }
        // Check account-level administrative suspension or block
        if (user.accountStatus === 'BLOCKED' || user.isDeleted) {
            return {
                hasAccess: false,
                code: 'SUBSCRIPTION_REVOKED',
                reason: user.statusReason || 'User account has been suspended or blocked by platform administration'
            };
        }
        if (user.accountStatus === 'SUSPENDED' && (!user.suspendedUntil || user.suspendedUntil > new Date())) {
            return {
                hasAccess: false,
                code: 'SUBSCRIPTION_REVOKED',
                reason: user.statusReason || 'User account is temporarily suspended'
            };
        }
        // Fetch the most recent active or latest subscription
        const sub = await Subscription_1.SubscriptionModel.findOne({
            userId: user._id
        }).sort({ endDate: -1 });
        if (!sub) {
            // Main Admins and Moderators have full role-based access fallback if no individual subscription exists
            if (user.role === roles_1.UserRole.SUPER_ADMIN || user.role === roles_1.UserRole.MODERATOR) {
                return {
                    hasAccess: true,
                    code: 'ACCESS_GRANTED',
                    isRoleBypass: true,
                    planName: user.role === roles_1.UserRole.SUPER_ADMIN ? 'Main Admin Unlimited' : 'Moderator Partner Desk',
                    reason: 'Authorized access via administrative platform role'
                };
            }
            return {
                hasAccess: false,
                code: 'SUBSCRIPTION_REQUIRED',
                reason: 'No active subscription found. Please choose a subscription tier.'
            };
        }
        const now = new Date();
        // Check revocation
        if (sub.isRevoked || sub.status === subscriptions_1.SubscriptionStatus.REVOKED) {
            return {
                hasAccess: false,
                code: 'SUBSCRIPTION_REVOKED',
                planId: sub.planId,
                status: subscriptions_1.SubscriptionStatus.REVOKED,
                reason: sub.revocationReason || 'Subscription access was revoked by platform administration'
            };
        }
        // Check start date (not yet active)
        if (now < sub.startDate) {
            return {
                hasAccess: false,
                code: 'SUBSCRIPTION_REQUIRED',
                planId: sub.planId,
                status: subscriptions_1.SubscriptionStatus.PENDING,
                startDate: sub.startDate.toISOString(),
                endDate: sub.endDate.toISOString(),
                reason: 'Subscription scheduled period has not yet started'
            };
        }
        // Dynamic Server-Side Expiration Check
        if (now > sub.endDate) {
            if (sub.status !== subscriptions_1.SubscriptionStatus.EXPIRED) {
                sub.status = subscriptions_1.SubscriptionStatus.EXPIRED;
                await sub.save();
                logger_1.logger.info(`Subscription ${sub._id} for user ${user._id} marked as EXPIRED dynamically upon access check.`);
            }
            return {
                hasAccess: false,
                code: 'SUBSCRIPTION_EXPIRED',
                planId: sub.planId,
                status: subscriptions_1.SubscriptionStatus.EXPIRED,
                startDate: sub.startDate.toISOString(),
                endDate: sub.endDate.toISOString(),
                expiresAtFormatted: sub.endDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                daysRemaining: 0,
                reason: `Subscription expired on ${sub.endDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}. Please renew your plan.`
            };
        }
        // Active within valid time boundaries
        if (sub.status === subscriptions_1.SubscriptionStatus.ACTIVE) {
            const plan = await subscription_service_1.subscriptionService.getPlanById(sub.planId);
            const msRemaining = sub.endDate.getTime() - now.getTime();
            const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
            // Secret Code Lock Check: User must enter their secret code to unlock the tool if code was issued
            if (sub.secretCode && !sub.isSecretCodeClaimed) {
                return {
                    hasAccess: false,
                    code: 'SECRET_CODE_REQUIRED',
                    needsSecretCode: true,
                    isApproved: sub.isApprovedByAdmin !== false,
                    planId: sub.planId,
                    planName: plan?.name || sub.planId,
                    status: subscriptions_1.SubscriptionStatus.ACTIVE,
                    startDate: sub.startDate.toISOString(),
                    endDate: sub.endDate.toISOString(),
                    expiresAtFormatted: sub.endDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    daysRemaining,
                    reason: sub.isApprovedByAdmin !== false
                        ? 'Your VIP subscription is active! Enter the Secret Activation Code sent to your email to unlock the tool.'
                        : 'Your subscription purchase is pending admin approval. Your Secret Code will be dispatched upon approval.'
                };
            }
            return {
                hasAccess: true,
                code: 'ACCESS_GRANTED',
                planId: sub.planId,
                planName: plan?.name || sub.planId,
                status: subscriptions_1.SubscriptionStatus.ACTIVE,
                startDate: sub.startDate.toISOString(),
                endDate: sub.endDate.toISOString(),
                expiresAtFormatted: sub.endDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                daysRemaining,
                needsSecretCode: false,
                isApproved: true,
                reason: 'Active premium subscription confirmed'
            };
        }
        return {
            hasAccess: false,
            code: 'SUBSCRIPTION_REQUIRED',
            status: sub.status,
            reason: `Subscription status is ${sub.status}`
        };
    }
    /**
     * Main Admin manual subscription grant.
     * Records manual grant with admin audit metadata and explicitly does NOT create sales/commissions.
     */
    async grantManualSubscription(adminId, input) {
        const targetUser = await User_1.UserModel.findOne({ email: input.targetEmail.toLowerCase().trim() });
        if (!targetUser) {
            throw apiError_1.ApiError.notFound(`User with email ${input.targetEmail} was not found`);
        }
        const plan = await subscription_service_1.subscriptionService.getPlanById(input.planId);
        if (!plan) {
            throw apiError_1.ApiError.notFound(`Plan ${input.planId} does not exist`);
        }
        const now = new Date();
        const endDate = (0, plans_1.calculatePlanExpiration)(now, plan.duration);
        // Cancel prior active subscriptions for this user
        await Subscription_1.SubscriptionModel.updateMany({ userId: targetUser._id, status: subscriptions_1.SubscriptionStatus.ACTIVE }, { $set: { status: subscriptions_1.SubscriptionStatus.CANCELLED } });
        const secretCode = (0, crypto_1.generateSecretActivationCode)();
        const subscription = await Subscription_1.SubscriptionModel.create({
            userId: targetUser._id,
            planId: plan.id,
            status: subscriptions_1.SubscriptionStatus.ACTIVE,
            startDate: now,
            endDate,
            secretCode,
            isSecretCodeClaimed: true,
            secretCodeClaimedAt: now,
            isApprovedByAdmin: true,
            approvedByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
            approvedAt: now,
            isManualGrant: true,
            grantReason: input.reason.trim(),
            grantedByAdminId: new mongoose_1.default.Types.ObjectId(adminId)
        });
        const admin = await User_1.UserModel.findById(adminId);
        await AuditLog_1.AuditLogModel.create({
            action: 'SUBSCRIPTION_MANUAL_GRANT',
            adminId: new mongoose_1.default.Types.ObjectId(adminId),
            adminEmail: admin?.email || 'admin@roulette.tools',
            targetUserId: targetUser._id,
            targetUserEmail: targetUser.email,
            reason: input.reason.trim(),
            newValue: {
                subscriptionId: subscription._id,
                planId: plan.id,
                secretCode,
                startDate: now,
                endDate,
                isManualGrant: true
            }
        });
        logger_1.logger.info(`Main Admin ${adminId} manually granted ${plan.id} to ${input.targetEmail}. Secret code: ${secretCode}`);
        if (targetUser.email) {
            await email_service_1.emailService.sendVipSecretCodeEmail({
                to: targetUser.email,
                name: targetUser.name || 'Member',
                planName: plan.name,
                durationDays: plan.durationDays,
                secretCode
            }).catch((err) => logger_1.logger.error('Failed to dispatch secret code email on manual grant', err));
        }
        await notification_service_1.notificationService.createNotification(targetUser._id, 'SUBSCRIPTION_ACTIVATED', '🎉 VIP Secret Activation Code Issued', `Your subscription has been activated! Your Secret Code is ${secretCode}. Enter it on the Tool page to unlock.`, '/dashboard/tool').catch(() => null);
        return subscription;
    }
    /**
     * Main Admin subscription extension.
     */
    async extendSubscription(adminId, input) {
        const sub = await Subscription_1.SubscriptionModel.findById(input.subscriptionId);
        if (!sub) {
            throw apiError_1.ApiError.notFound(`Subscription ${input.subscriptionId} was not found`);
        }
        if (sub.isRevoked) {
            throw apiError_1.ApiError.badRequest('Cannot extend a revoked subscription. Grant a new subscription instead.');
        }
        const now = new Date();
        const baseDate = sub.endDate > now ? sub.endDate : now;
        const newEndDate = (0, plans_1.calculatePlanExpiration)(baseDate, {
            unit: input.extensionUnit,
            value: input.extensionValue
        });
        const previousEndDate = sub.endDate;
        sub.endDate = newEndDate;
        sub.status = subscriptions_1.SubscriptionStatus.ACTIVE;
        sub.extendedAt = now;
        sub.extensionReason = input.reason.trim();
        await sub.save();
        const admin = await User_1.UserModel.findById(adminId);
        const targetUser = await User_1.UserModel.findById(sub.userId);
        await AuditLog_1.AuditLogModel.create({
            action: 'SUBSCRIPTION_EXTEND',
            adminId: new mongoose_1.default.Types.ObjectId(adminId),
            adminEmail: admin?.email || 'admin@roulette.tools',
            targetUserId: sub.userId,
            targetUserEmail: targetUser?.email,
            reason: input.reason.trim(),
            previousValue: { endDate: previousEndDate },
            newValue: {
                endDate: newEndDate,
                extension: `${input.extensionValue} ${input.extensionUnit}`
            }
        });
        logger_1.logger.info(`Main Admin ${adminId} extended subscription ${sub._id} by ${input.extensionValue} ${input.extensionUnit}. New expiry: ${newEndDate.toISOString()}`);
        await notification_service_1.notificationService.createNotification(sub.userId, 'SUBSCRIPTION_ACTIVATED', 'Subscription Extended', `Your subscription has been extended by ${input.extensionValue} ${input.extensionUnit.toLowerCase()}.`, '/dashboard/tool').catch(() => null);
        return sub;
    }
    /**
     * Main Admin subscription revocation.
     */
    async revokeSubscription(adminId, input) {
        const sub = await Subscription_1.SubscriptionModel.findById(input.subscriptionId);
        if (!sub) {
            throw apiError_1.ApiError.notFound(`Subscription ${input.subscriptionId} was not found`);
        }
        const previousStatus = sub.status;
        sub.status = subscriptions_1.SubscriptionStatus.REVOKED;
        sub.isRevoked = true;
        sub.revokedAt = new Date();
        sub.revocationReason = input.reason.trim();
        await sub.save();
        const admin = await User_1.UserModel.findById(adminId);
        const targetUser = await User_1.UserModel.findById(sub.userId);
        await AuditLog_1.AuditLogModel.create({
            action: 'SUBSCRIPTION_REVOKE',
            adminId: new mongoose_1.default.Types.ObjectId(adminId),
            adminEmail: admin?.email || 'admin@roulette.tools',
            targetUserId: sub.userId,
            targetUserEmail: targetUser?.email,
            reason: input.reason.trim(),
            previousValue: { status: previousStatus },
            newValue: { status: subscriptions_1.SubscriptionStatus.REVOKED, isRevoked: true }
        });
        logger_1.logger.info(`Main Admin ${adminId} revoked subscription ${sub._id}. Reason: ${input.reason}`);
        await notification_service_1.notificationService.createNotification(sub.userId, 'SUBSCRIPTION_REVOKED', 'Subscription Access Revoked', `Your subscription access has been revoked: ${input.reason}`, '/plans').catch(() => null);
        return sub;
    }
    /**
     * List platform subscriptions for Main Admin overview with filtering and pagination.
     */
    async listAllSubscriptions(options) {
        const page = options?.page ? Math.max(1, options.page) : 1;
        const limit = options?.limit ? Math.min(100, Math.max(1, options.limit)) : 50;
        const query = {};
        const now = new Date();
        // Dynamically mark active passes that have passed their endDate as EXPIRED in MongoDB
        try {
            await Subscription_1.SubscriptionModel.updateMany({ status: subscriptions_1.SubscriptionStatus.ACTIVE, endDate: { $lte: now } }, { $set: { status: subscriptions_1.SubscriptionStatus.EXPIRED } });
        }
        catch (e) {
            // Ignore background sync errors
        }
        if (options?.status && options.status !== 'ALL') {
            if (options.status === 'ACTIVE') {
                query.status = subscriptions_1.SubscriptionStatus.ACTIVE;
                query.endDate = { $gt: now };
                query.isRevoked = { $ne: true };
            }
            else if (options.status === 'EXPIRED') {
                query.$or = [
                    { status: subscriptions_1.SubscriptionStatus.EXPIRED },
                    { endDate: { $lte: now } }
                ];
            }
            else if (options.status === 'REVOKED') {
                query.$or = [
                    { status: subscriptions_1.SubscriptionStatus.REVOKED },
                    { isRevoked: true }
                ];
            }
            else if (options.status === 'CLAIM_PENDING') {
                query.status = subscriptions_1.SubscriptionStatus.ACTIVE;
                query.endDate = { $gt: now };
                query.isRevoked = { $ne: true };
                query.isSecretCodeClaimed = { $ne: true };
            }
            else {
                query.status = options.status;
            }
        }
        if (options?.planId && options.planId !== 'ALL') {
            query.planId = options.planId;
        }
        if (options?.search && options.search.trim() !== '') {
            const searchClean = options.search.trim();
            const searchRegex = new RegExp(searchClean, 'i');
            const users = await User_1.UserModel.find({
                $or: [
                    { email: searchRegex },
                    { name: searchRegex },
                    { phone: searchRegex }
                ]
            }).select('_id').lean();
            const userIds = users.map((u) => u._id);
            const searchConditions = [
                { planId: searchRegex },
                { secretCode: searchRegex },
                { grantReason: searchRegex },
                { userId: { $in: userIds } }
            ];
            if (mongoose_1.default.Types.ObjectId.isValid(searchClean)) {
                searchConditions.push({ _id: new mongoose_1.default.Types.ObjectId(searchClean) });
            }
            if (query.$or) {
                query.$and = [{ $or: query.$or }, { $or: searchConditions }];
                delete query.$or;
            }
            else {
                query.$or = searchConditions;
            }
        }
        const [total, rawSubscriptions, allDbPlans] = await Promise.all([
            Subscription_1.SubscriptionModel.countDocuments(query),
            Subscription_1.SubscriptionModel.find(query)
                .populate('userId', 'name email phone role accountStatus')
                .populate('grantedByAdminId', 'name email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Plan_1.PlanModel.find().lean()
        ]);
        const planMap = new Map();
        Object.values(plans_1.SUBSCRIPTION_PLANS).forEach((p) => {
            planMap.set(p.id.toLowerCase(), p);
        });
        allDbPlans.forEach((p) => {
            planMap.set(p.planId?.toLowerCase(), p);
            if (p.id)
                planMap.set(p.id.toLowerCase(), p);
        });
        const subscriptions = rawSubscriptions.map((s) => {
            const msRemaining = s.endDate ? new Date(s.endDate).getTime() - now.getTime() : 0;
            const matchedPlan = s.planId ? planMap.get(s.planId.toLowerCase()) : null;
            return {
                ...s,
                planName: matchedPlan?.name || s.planId.replace(/_/g, ' '),
                planPriceUsd: matchedPlan?.priceUsd || (matchedPlan?.priceCents ? matchedPlan.priceCents / 100 : undefined),
                daysRemaining: Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)))
            };
        });
        return {
            subscriptions,
            total,
            page,
            totalPages: Math.max(1, Math.ceil(total / limit))
        };
    }
    /**
     * Unlock prediction tool using customer's secret activation code
     */
    async unlockToolWithSecretCode(userId, enteredCode) {
        const cleanCode = enteredCode.trim().toUpperCase();
        if (!cleanCode || cleanCode.length < 3) {
            throw apiError_1.ApiError.badRequest('Please enter a valid secret activation code');
        }
        const now = new Date();
        const sub = await Subscription_1.SubscriptionModel.findOne({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            status: subscriptions_1.SubscriptionStatus.ACTIVE,
            isRevoked: { $ne: true },
            endDate: { $gt: now }
        }).sort({ endDate: -1 });
        if (!sub) {
            throw apiError_1.ApiError.badRequest('No active approved subscription found for this account. Please verify your purchase.');
        }
        if (sub.isSecretCodeClaimed) {
            return {
                success: true,
                message: 'Your prediction engine is already unlocked and active!'
            };
        }
        if (!sub.secretCode || sub.secretCode.trim().toUpperCase() !== cleanCode) {
            throw apiError_1.ApiError.badRequest('Invalid Secret Activation Code. Please check the code sent to your email.');
        }
        sub.isSecretCodeClaimed = true;
        sub.secretCodeClaimedAt = new Date();
        await sub.save();
        await AuditLog_1.AuditLogModel.create({
            action: 'TOOL_SECRET_CODE_UNLOCKED',
            targetUserId: sub.userId,
            reason: 'Customer successfully unlocked tool with secret code',
            details: {
                subscriptionId: sub._id.toString(),
                secretCode: sub.secretCode
            }
        }).catch((e) => logger_1.logger.error('Failed to log audit for tool unlock', e));
        return {
            success: true,
            message: 'VIP Prediction Engine successfully unlocked! Enjoy full real-time intelligence.'
        };
    }
    /**
     * Admin: Approve subscription and dispatch secret code email to user
     */
    async approveSubscriptionAndSendSecretCode(adminId, adminEmail, subscriptionId) {
        const sub = await Subscription_1.SubscriptionModel.findById(subscriptionId);
        if (!sub) {
            throw apiError_1.ApiError.notFound(`Subscription ${subscriptionId} not found`);
        }
        if (!sub.secretCode) {
            sub.secretCode = (0, crypto_1.generateSecretActivationCode)();
        }
        sub.isApprovedByAdmin = true;
        sub.approvedByAdminId = new mongoose_1.default.Types.ObjectId(adminId);
        sub.approvedAt = new Date();
        sub.status = subscriptions_1.SubscriptionStatus.ACTIVE;
        await sub.save();
        const user = await User_1.UserModel.findById(sub.userId);
        const plan = await subscription_service_1.subscriptionService.getPlanById(sub.planId);
        const planName = plan?.name || sub.planId;
        const durationDays = plan?.durationDays || 30;
        if (user && user.email) {
            await email_service_1.emailService.sendVipSecretCodeEmail({
                to: user.email,
                name: user.name || 'Member',
                planName,
                durationDays,
                secretCode: sub.secretCode
            }).catch((err) => logger_1.logger.error('Failed to dispatch secret code email', err));
        }
        await notification_service_1.notificationService.createNotification(user._id, 'SUBSCRIPTION_ACTIVATED', '🎉 VIP Secret Activation Code Issued', `Your subscription is approved! Secret Code: ${sub.secretCode}. Enter it on the Tool page to unlock.`, '/dashboard/tool').catch(() => null);
        await AuditLog_1.AuditLogModel.create({
            action: 'SUBSCRIPTION_APPROVED_SECRET_CODE_SENT',
            adminId: new mongoose_1.default.Types.ObjectId(adminId),
            adminEmail,
            targetUserId: sub.userId,
            targetUserEmail: user?.email,
            reason: 'Admin approved VIP subscription and dispatched secret activation code',
            details: {
                subscriptionId: sub._id.toString(),
                secretCode: sub.secretCode,
                planId: sub.planId
            }
        }).catch((e) => logger_1.logger.error('Failed to log audit for subscription approval', e));
        return {
            subscription: sub,
            secretCode: sub.secretCode
        };
    }
    /**
     * Admin: Manually unlock tool for a subscription without requiring user to enter code
     */
    async manuallyUnlockToolForSubscription(adminId, adminEmail, subscriptionId) {
        const sub = await Subscription_1.SubscriptionModel.findById(subscriptionId);
        if (!sub) {
            throw apiError_1.ApiError.notFound(`Subscription ${subscriptionId} not found`);
        }
        sub.isApprovedByAdmin = true;
        sub.isSecretCodeClaimed = true;
        sub.secretCodeClaimedAt = new Date();
        sub.status = subscriptions_1.SubscriptionStatus.ACTIVE;
        await sub.save();
        await AuditLog_1.AuditLogModel.create({
            action: 'TOOL_MANUALLY_UNLOCKED_BY_ADMIN',
            adminId: new mongoose_1.default.Types.ObjectId(adminId),
            adminEmail,
            targetUserId: sub.userId,
            reason: 'Admin manually unlocked prediction tool access for user'
        }).catch(() => null);
        return sub;
    }
}
exports.SubscriptionAccessService = SubscriptionAccessService;
exports.subscriptionAccessService = new SubscriptionAccessService();
//# sourceMappingURL=subscriptionAccess.service.js.map