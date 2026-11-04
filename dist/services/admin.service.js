"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = exports.AdminService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const Subscription_1 = require("../models/Subscription");
const Payment_1 = require("../models/Payment");
const ReferralCommission_1 = require("../models/ReferralCommission");
const AuditLog_1 = require("../models/AuditLog");
const DualApproval_1 = require("../models/DualApproval");
const roles_1 = require("../shared/roles");
const subscriptions_1 = require("../shared/subscriptions");
const plans_1 = require("../shared/plans");
const Plan_1 = require("../models/Plan");
const crypto_1 = require("../utils/crypto");
const phone_1 = require("../utils/phone");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const cache_1 = require("../utils/cache");
class AdminService {
    /**
     * Log an immutable administrative action for compliance and security auditing
     */
    async logAction(params) {
        const entry = await AuditLog_1.AuditLogModel.create({
            action: params.action,
            adminId: new mongoose_1.default.Types.ObjectId(params.adminId),
            adminEmail: params.adminEmail,
            reason: params.reason,
            targetUserId: params.targetUserId ? new mongoose_1.default.Types.ObjectId(params.targetUserId) : undefined,
            targetUserEmail: params.targetUserEmail,
            targetResourceId: params.targetResourceId,
            resourceType: params.resourceType,
            previousValue: params.previousValue,
            newValue: params.newValue,
            details: params.details,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent
        });
        logger_1.logger.info(`[ADMIN AUDIT] ${params.action} by ${params.adminEmail}. Reason: ${params.reason}`);
        cache_1.memoryCache.del('admin:dashboardMetrics');
        return entry;
    }
    /**
     * Fetch comprehensive platform metrics with transparent financial breakdown
     */
    async getDashboardMetrics() {
        return cache_1.memoryCache.getOrSet('admin:dashboardMetrics', 15, async () => {
            const now = new Date();
            const [totalRegisteredUsers, activeUsers, blockedUsers, suspendedUsers, deletedUsers, activeSubscriptions, expiredSubscriptions, confirmedPaymentCount, pendingPaymentCount, moderatorsCount, finishedPaymentsAgg, refundedPaymentsAgg, commissionsAgg, referralSalesAgg, subscriptionsByPlan, recentAuditActivities] = await Promise.all([
                User_1.UserModel.countDocuments({ isDeleted: { $ne: true } }),
                User_1.UserModel.countDocuments({ isDeleted: { $ne: true }, accountStatus: User_1.AccountStatus.ACTIVE, isActive: true }),
                User_1.UserModel.countDocuments({ isDeleted: { $ne: true }, accountStatus: User_1.AccountStatus.BLOCKED }),
                User_1.UserModel.countDocuments({ isDeleted: { $ne: true }, accountStatus: User_1.AccountStatus.SUSPENDED }),
                User_1.UserModel.countDocuments({ isDeleted: true }),
                Subscription_1.SubscriptionModel.countDocuments({ status: subscriptions_1.SubscriptionStatus.ACTIVE, isRevoked: { $ne: true }, endDate: { $gt: now } }),
                Subscription_1.SubscriptionModel.countDocuments({
                    $or: [
                        { status: subscriptions_1.SubscriptionStatus.EXPIRED },
                        { endDate: { $lte: now } }
                    ]
                }),
                Payment_1.PaymentModel.countDocuments({ status: subscriptions_1.PaymentStatus.FINISHED }),
                Payment_1.PaymentModel.countDocuments({ status: { $in: [subscriptions_1.PaymentStatus.WAITING, subscriptions_1.PaymentStatus.CONFIRMING, subscriptions_1.PaymentStatus.SENDING] } }),
                User_1.UserModel.countDocuments({ role: roles_1.UserRole.MODERATOR, isDeleted: { $ne: true } }),
                Payment_1.PaymentModel.aggregate([
                    { $match: { isFulfilled: true } },
                    { $group: { _id: null, total: { $sum: '$priceAmount' } } }
                ]),
                Payment_1.PaymentModel.aggregate([
                    { $match: { status: subscriptions_1.PaymentStatus.REFUNDED } },
                    { $group: { _id: null, total: { $sum: '$priceAmount' } } }
                ]),
                ReferralCommission_1.ReferralCommissionModel.aggregate([
                    { $match: { status: { $ne: 'REVERSED' } } },
                    { $group: { _id: null, total: { $sum: '$amountUsd' } } }
                ]),
                ReferralCommission_1.ReferralCommissionModel.aggregate([
                    { $match: { status: { $ne: 'REVERSED' } } },
                    {
                        $lookup: {
                            from: 'payments',
                            localField: 'paymentId',
                            foreignField: '_id',
                            as: 'payment'
                        }
                    },
                    { $unwind: '$payment' },
                    { $group: { _id: null, total: { $sum: '$payment.priceAmount' } } }
                ]),
                Subscription_1.SubscriptionModel.aggregate([
                    { $group: { _id: '$planId', count: { $sum: 1 } } }
                ]),
                AuditLog_1.AuditLogModel.find().sort({ createdAt: -1 }).limit(12).lean()
            ]);
            // Financial Calculation from fast aggregation outputs
            const grossSalesUsd = finishedPaymentsAgg[0]?.total || 0;
            const refundsUsd = refundedPaymentsAgg[0]?.total || 0;
            const outstandingCommissionLiabilitiesUsd = commissionsAgg[0]?.total || 0;
            const referralAttributedSalesUsd = referralSalesAgg[0]?.total || 0;
            // 1% estimated crypto gateway & network transfer fee
            const estimatedPaymentFeesUsd = Math.round(grossSalesUsd * 0.01 * 100) / 100;
            const netRevenueUsd = Math.round((grossSalesUsd - refundsUsd - estimatedPaymentFeesUsd - outstandingCommissionLiabilitiesUsd) * 100) / 100;
            // Plan distribution dictionary
            const planDistribution = {};
            for (const p of plans_1.PLANS_ARRAY) {
                planDistribution[p.id] = 0;
            }
            for (const row of subscriptionsByPlan) {
                if (row._id) {
                    planDistribution[row._id] = row.count;
                }
            }
            return {
                totalRegisteredUsers,
                activeUsers,
                blockedUsers,
                suspendedUsers,
                deletedUsers,
                activeSubscriptions,
                expiredSubscriptions,
                confirmedPaymentCount,
                pendingPaymentCount,
                moderatorsCount,
                financials: {
                    grossSalesUsd: Math.round(grossSalesUsd * 100) / 100,
                    refundsUsd: Math.round(refundsUsd * 100) / 100,
                    estimatedPaymentFeesUsd,
                    outstandingCommissionLiabilitiesUsd: Math.round(outstandingCommissionLiabilitiesUsd * 100) / 100,
                    netRevenueUsd,
                    referralAttributedSalesUsd: Math.round(referralAttributedSalesUsd * 100) / 100
                },
                planDistribution,
                recentAuditActivities
            };
        });
    }
    /**
     * Search, filter, and paginate platform users
     */
    async getUsers(filter) {
        const page = Math.max(1, filter.page || 1);
        const limit = Math.min(100, Math.max(1, filter.limit || 20));
        const skip = (page - 1) * limit;
        const query = {};
        const cleanParam = (val) => {
            if (!val || typeof val !== 'string')
                return undefined;
            const trimmed = val.trim();
            return (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') ? undefined : trimmed;
        };
        const targetAccountStatus = cleanParam(filter.accountStatus);
        const targetRole = cleanParam(filter.role);
        const targetSearch = cleanParam(filter.search);
        // Don't show deleted users unless explicitly requested
        if (targetAccountStatus === User_1.AccountStatus.DELETED) {
            query.isDeleted = true;
        }
        else if (targetAccountStatus) {
            query.accountStatus = targetAccountStatus;
            query.isDeleted = { $ne: true };
        }
        else {
            query.isDeleted = { $ne: true };
        }
        if (targetRole) {
            query.role = targetRole;
        }
        if (filter.subscriptionStatus === 'ACTIVE') {
            const activeSubs = await Subscription_1.SubscriptionModel.find({
                status: subscriptions_1.SubscriptionStatus.ACTIVE,
                isRevoked: { $ne: true },
                endDate: { $gt: new Date() }
            }).select('userId').lean();
            const activeUserIds = activeSubs.map((s) => s.userId);
            query._id = { $in: activeUserIds };
        }
        else if (filter.subscriptionStatus === 'INACTIVE' || filter.subscriptionStatus === 'EXPIRED') {
            const activeSubs = await Subscription_1.SubscriptionModel.find({
                status: subscriptions_1.SubscriptionStatus.ACTIVE,
                isRevoked: { $ne: true },
                endDate: { $gt: new Date() }
            }).select('userId').lean();
            const activeUserIds = activeSubs.map((s) => s.userId);
            query._id = { $nin: activeUserIds };
        }
        if (filter.search && filter.search.trim() !== '') {
            const sanitized = filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(sanitized, 'i');
            query.$or = [
                { name: regex },
                { email: regex },
                { phone: regex },
                { referralCode: regex }
            ];
        }
        const [rawUsers, total, summaryCounts] = await Promise.all([
            User_1.UserModel.find(query)
                .select('-passwordHash -twoFactorSecret')
                .populate('referredBy', 'name email referralCode')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User_1.UserModel.countDocuments(query),
            Promise.all([
                User_1.UserModel.countDocuments({ isDeleted: { $ne: true } }),
                User_1.UserModel.countDocuments({ role: roles_1.UserRole.SUPER_ADMIN, isDeleted: { $ne: true } }),
                User_1.UserModel.countDocuments({ role: roles_1.UserRole.MODERATOR, isDeleted: { $ne: true } }),
                Subscription_1.SubscriptionModel.countDocuments({ status: subscriptions_1.SubscriptionStatus.ACTIVE, isRevoked: { $ne: true }, endDate: { $gt: new Date() } })
            ])
        ]);
        const summary = {
            totalUsers: summaryCounts[0] || 0,
            totalAdmins: summaryCounts[1] || 0,
            totalMods: summaryCounts[2] || 0,
            totalActiveSubs: summaryCounts[3] || 0
        };
        if (!rawUsers || rawUsers.length === 0) {
            return { users: [], total, page, limit, totalPages: Math.ceil(total / limit) || 1, summary };
        }
        const userIds = rawUsers.map((u) => u._id);
        const now = new Date();
        // High performance bulk batching: replace individual round-trips with indexed queries
        const [allSubs, paymentsAgg, allPlans] = await Promise.all([
            Subscription_1.SubscriptionModel.find({ userId: { $in: userIds } })
                .sort({ endDate: -1 })
                .lean(),
            Payment_1.PaymentModel.aggregate([
                { $match: { userId: { $in: userIds }, isFulfilled: true } },
                { $group: { _id: '$userId', totalSpent: { $sum: '$priceAmount' }, orderCount: { $sum: 1 } } }
            ]),
            cache_1.memoryCache.getOrSet('admin:allPlans', 60, () => Plan_1.PlanModel.find().lean())
        ]);
        const planMap = new Map();
        for (const p of allPlans) {
            planMap.set(p.planId, p);
        }
        // Index lookup maps by userId string
        const subsByUserMap = new Map();
        for (const sub of allSubs) {
            const uid = sub.userId.toString();
            if (!subsByUserMap.has(uid))
                subsByUserMap.set(uid, []);
            subsByUserMap.get(uid).push(sub);
        }
        const paymentsByUserMap = new Map();
        for (const p of paymentsAgg) {
            paymentsByUserMap.set(p._id.toString(), {
                totalSpent: p.totalSpent || 0,
                orderCount: p.orderCount || 0
            });
        }
        const users = rawUsers.map((u) => {
            const uid = u._id.toString();
            const userObj = {
                ...u,
                id: uid,
                _id: uid
            };
            const userSubs = subsByUserMap.get(uid) || [];
            // Find active sub first
            const activeSub = userSubs.find((s) => s.status === subscriptions_1.SubscriptionStatus.ACTIVE &&
                !s.isRevoked &&
                new Date(s.endDate) > now);
            // Or fallback to latest sub
            const latestSub = userSubs[0];
            const targetSub = activeSub || latestSub;
            if (targetSub) {
                const pObj = planMap.get(targetSub.planId);
                const resolvedPlanName = pObj?.name || targetSub.planId?.replace(/_/g, ' ').toUpperCase();
                const isExpired = !activeSub && (new Date(targetSub.endDate).getTime() <= now.getTime() || targetSub.status === subscriptions_1.SubscriptionStatus.EXPIRED);
                const msRemaining = new Date(targetSub.endDate).getTime() - now.getTime();
                const daysRemaining = isExpired ? 0 : Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
                userObj.activeSubscription = {
                    ...targetSub,
                    id: targetSub._id?.toString(),
                    _id: targetSub._id?.toString(),
                    planName: resolvedPlanName,
                    daysRemaining,
                    isExpired
                };
            }
            else {
                userObj.activeSubscription = null;
            }
            const pData = paymentsByUserMap.get(uid);
            userObj.totalSpentUsd = pData ? Math.round(pData.totalSpent * 100) / 100 : 0;
            userObj.orderCount = pData ? pData.orderCount : 0;
            return userObj;
        });
        return {
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1,
            summary
        };
    }
    /**
     * Get single user detailed profile, payment records, subscription history, and audit log
     */
    async getUserDetails(userId) {
        const user = await User_1.UserModel.findById(userId)
            .select('-passwordHash -twoFactorSecret')
            .populate('referredBy', 'name email referralCode');
        if (!user) {
            throw apiError_1.ApiError.notFound(`User ${userId} does not exist`);
        }
        const [subscriptions, payments, commissions, auditLogs, allPlans] = await Promise.all([
            Subscription_1.SubscriptionModel.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
            Payment_1.PaymentModel.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
            ReferralCommission_1.ReferralCommissionModel.find({
                $or: [{ moderatorId: user._id }, { referredUserId: user._id }]
            }).sort({ createdAt: -1 }).lean(),
            AuditLog_1.AuditLogModel.find({
                $or: [{ targetUserId: user._id }, { adminId: user._id }]
            }).sort({ createdAt: -1 }).limit(25).lean(),
            Plan_1.PlanModel.find().lean()
        ]);
        const planMap = new Map();
        for (const p of allPlans) {
            planMap.set(p.planId, p);
        }
        const mappedSubs = subscriptions.map((s) => ({
            ...s,
            id: s._id.toString(),
            planName: planMap.get(s.planId)?.name || s.planId?.replace(/_/g, ' ').toUpperCase()
        }));
        const mappedPayments = payments.map((p) => ({
            ...p,
            id: p._id.toString(),
            priceAmountUsd: p.priceAmount ?? p.priceAmountUsd ?? 0,
            paymentStatus: p.status ?? p.paymentStatus
        }));
        return {
            user: {
                ...user.toObject(),
                id: user._id.toString(),
                _id: user._id.toString()
            },
            subscriptions: mappedSubs,
            payments: mappedPayments,
            commissions,
            auditLogs
        };
    }
    /**
     * Edit permitted profile attributes (name, phone, role, commission) with mandatory audit logging
     */
    async updateUserProfile(adminId, adminEmail, userId, input, reason) {
        const user = await User_1.UserModel.findById(userId);
        if (!user) {
            throw apiError_1.ApiError.notFound(`User ${userId} does not exist`);
        }
        const previousValue = {
            name: user.name,
            phone: user.phone,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            role: user.role,
            moderatorCommissionRate: user.moderatorCommissionRate,
            isActive: user.isActive
        };
        if (input.name)
            user.name = input.name.trim();
        if (input.phone !== undefined)
            user.phone = input.phone.trim() || undefined;
        if (input.isEmailVerified !== undefined)
            user.isEmailVerified = input.isEmailVerified;
        if (input.isPhoneVerified !== undefined)
            user.isPhoneVerified = input.isPhoneVerified;
        if (input.isActive !== undefined)
            user.isActive = input.isActive;
        if (input.moderatorNotes !== undefined)
            user.moderatorNotes = input.moderatorNotes;
        if (input.role !== undefined && Object.values(roles_1.UserRole).includes(input.role)) {
            user.role = input.role;
            if (input.role === roles_1.UserRole.MODERATOR && !user.referralCode) {
                user.referralCode = 'MOD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
            }
        }
        if (input.moderatorCommissionRate !== undefined) {
            const rate = Number(input.moderatorCommissionRate);
            if (!isNaN(rate) && rate >= 0 && rate <= 100) {
                user.moderatorCommissionRate = rate;
            }
        }
        await user.save();
        await this.logAction({
            action: 'USER_PROFILE_EDIT',
            adminId,
            adminEmail,
            targetUserId: user._id.toString(),
            targetUserEmail: user.email,
            reason,
            previousValue,
            newValue: {
                name: user.name,
                phone: user.phone,
                isEmailVerified: user.isEmailVerified,
                isPhoneVerified: user.isPhoneVerified,
                role: user.role,
                moderatorCommissionRate: user.moderatorCommissionRate,
                isActive: user.isActive
            }
        });
        return user;
    }
    /**
     * Change user account status (BLOCK, UNBLOCK, SUSPEND)
     */
    async changeUserStatus(adminId, adminEmail, userId, action, reason, suspendedUntil) {
        const user = await User_1.UserModel.findById(userId);
        if (!user) {
            throw apiError_1.ApiError.notFound(`User ${userId} does not exist`);
        }
        // Safety constraint: Cannot block or suspend your own account
        if (user._id.toString() === adminId) {
            throw apiError_1.ApiError.badRequest('You cannot block or suspend your own active administrator account.');
        }
        const previousStatus = user.accountStatus;
        const now = new Date();
        if (action === 'BLOCK') {
            user.accountStatus = User_1.AccountStatus.BLOCKED;
            user.statusReason = reason.trim();
            user.statusChangedAt = now;
            user.statusChangedByAdminId = new mongoose_1.default.Types.ObjectId(adminId);
        }
        else if (action === 'UNBLOCK') {
            user.accountStatus = User_1.AccountStatus.ACTIVE;
            user.statusReason = reason.trim();
            user.statusChangedAt = now;
            user.statusChangedByAdminId = new mongoose_1.default.Types.ObjectId(adminId);
            user.suspendedUntil = undefined;
        }
        else if (action === 'SUSPEND') {
            user.accountStatus = User_1.AccountStatus.SUSPENDED;
            user.statusReason = reason.trim();
            user.statusChangedAt = now;
            user.statusChangedByAdminId = new mongoose_1.default.Types.ObjectId(adminId);
            user.suspendedUntil = suspendedUntil || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
        }
        await user.save();
        const auditAction = action === 'BLOCK' ? 'USER_BLOCK' : action === 'UNBLOCK' ? 'USER_UNBLOCK' : 'USER_SUSPEND';
        await this.logAction({
            action: auditAction,
            adminId,
            adminEmail,
            targetUserId: user._id.toString(),
            targetUserEmail: user.email,
            reason,
            previousValue: { status: previousStatus },
            newValue: {
                status: user.accountStatus,
                suspendedUntil: user.suspendedUntil
            }
        });
        return user;
    }
    /**
     * Delete user account permanently from MongoDB while preserving audit logs
     */
    async softDeleteUser(adminId, adminEmail, userId, reason) {
        const user = await User_1.UserModel.findById(userId);
        if (!user) {
            throw apiError_1.ApiError.notFound(`User ${userId} does not exist`);
        }
        if (user._id.toString() === adminId) {
            throw apiError_1.ApiError.badRequest('You cannot delete your own active administrator account.');
        }
        const targetUserId = user._id.toString();
        const targetEmail = user.email || 'unknown';
        const targetRole = user.role;
        // Revoke & remove any active subscriptions
        await Subscription_1.SubscriptionModel.deleteMany({ userId: user._id });
        // Permanent hard delete from MongoDB collection
        await User_1.UserModel.findByIdAndDelete(user._id);
        // Record immutable audit trail
        await this.logAction({
            action: 'USER_SOFT_DELETE',
            adminId,
            adminEmail,
            targetUserId,
            targetUserEmail: targetEmail,
            reason,
            details: {
                deletedRole: targetRole,
                deletedAt: new Date()
            }
        });
        logger_1.logger.info(`User ${targetEmail} (${targetRole}) was permanently deleted from MongoDB by Admin ${adminEmail}.`);
        return {
            _id: targetUserId,
            id: targetUserId,
            email: targetEmail,
            role: targetRole,
            isDeleted: true
        };
    }
    /**
     * Fetch paginated audit logs with action and date filters
     */
    async getAuditLogs(filter) {
        const page = Math.max(1, filter.page || 1);
        const limit = Math.min(100, Math.max(1, filter.limit || 25));
        const skip = (page - 1) * limit;
        const query = {};
        if (filter.action)
            query.action = filter.action;
        if (filter.adminEmail)
            query.adminEmail = new RegExp(filter.adminEmail.trim(), 'i');
        if (filter.targetUserEmail)
            query.targetUserEmail = new RegExp(filter.targetUserEmail.trim(), 'i');
        if (filter.startDate || filter.endDate) {
            query.createdAt = {};
            if (filter.startDate)
                query.createdAt.$gte = new Date(filter.startDate);
            if (filter.endDate)
                query.createdAt.$lte = new Date(filter.endDate);
        }
        const [logs, total] = await Promise.all([
            AuditLog_1.AuditLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            AuditLog_1.AuditLogModel.countDocuments(query)
        ]);
        return {
            logs,
            total,
            page,
            limit
        };
    }
    // --- Dual Approval Governance (Four-Eyes Principle) ---
    /**
     * Submit a high-risk administrative action for secondary confirmation
     */
    async requestDualApproval(adminId, adminEmail, action, payload, reason, targetUserId) {
        let targetUserEmail;
        if (targetUserId) {
            const u = await User_1.UserModel.findById(targetUserId);
            targetUserEmail = u?.email;
        }
        const request = await DualApproval_1.DualApprovalModel.create({
            action,
            requestedByAdminId: new mongoose_1.default.Types.ObjectId(adminId),
            requestedByAdminEmail: adminEmail,
            targetUserId: targetUserId ? new mongoose_1.default.Types.ObjectId(targetUserId) : undefined,
            targetUserEmail,
            reason: reason.trim(),
            payload,
            status: 'PENDING'
        });
        await this.logAction({
            action: 'DUAL_APPROVAL_REQUEST',
            adminId,
            adminEmail,
            targetUserId,
            targetUserEmail,
            reason: `Submitted dual-approval request for ${action}: ${reason}`,
            targetResourceId: request._id.toString(),
            resourceType: 'DualApproval',
            details: { payload }
        });
        return request;
    }
    /**
     * Confirm and execute a dual approval request by a second distinct Main Admin
     */
    async approveDualApproval(confirmingAdminId, confirmingAdminEmail, requestId) {
        const request = await DualApproval_1.DualApprovalModel.findById(requestId);
        if (!request) {
            throw apiError_1.ApiError.notFound(`Dual approval request ${requestId} was not found`);
        }
        if (request.status !== 'PENDING') {
            throw apiError_1.ApiError.badRequest(`Request is already ${request.status} and cannot be processed again.`);
        }
        // Strict Four-Eyes Principle: Cannot approve own request
        if (request.requestedByAdminId.toString() === confirmingAdminId) {
            throw apiError_1.ApiError.forbidden('Governance Violation: A second distinct Main Admin must confirm this critical action.');
        }
        // Execute the action payload
        let executionResult = null;
        if (request.action === 'ROLE_PROMOTION_SUPER_ADMIN') {
            // Promotion to Super Admin requires that total Super Admins will not exceed 4
            const superAdminCount = await User_1.UserModel.countDocuments({ role: roles_1.UserRole.SUPER_ADMIN });
            if (superAdminCount >= 4) {
                throw apiError_1.ApiError.badRequest('Maximum platform limit of 4 Main Admins is already reached.');
            }
            const target = await User_1.UserModel.findById(request.targetUserId);
            if (target) {
                target.role = roles_1.UserRole.SUPER_ADMIN;
                await target.save();
                executionResult = { promoted: target.email, role: target.role };
            }
        }
        else if (request.action === 'GLOBAL_COMMISSION_OVERRIDE') {
            // Global commission override execution
            executionResult = { appliedRate: request.payload.newRate };
        }
        request.status = 'APPROVED';
        request.confirmedByAdminId = new mongoose_1.default.Types.ObjectId(confirmingAdminId);
        request.confirmedByAdminEmail = confirmingAdminEmail;
        request.resolvedAt = new Date();
        await request.save();
        await this.logAction({
            action: 'DUAL_APPROVAL_CONFIRM',
            adminId: confirmingAdminId,
            adminEmail: confirmingAdminEmail,
            targetUserId: request.targetUserId?.toString(),
            targetUserEmail: request.targetUserEmail,
            reason: `Confirmed and executed high-risk dual approval: ${request.action}`,
            targetResourceId: request._id.toString(),
            resourceType: 'DualApproval',
            details: {
                requestedBy: request.requestedByAdminEmail,
                confirmedBy: confirmingAdminEmail,
                executionResult
            }
        });
        return {
            success: true,
            request,
            result: executionResult
        };
    }
    /**
     * Reject a pending dual approval request
     */
    async rejectDualApproval(rejectingAdminId, rejectingAdminEmail, requestId, rejectionReason) {
        const request = await DualApproval_1.DualApprovalModel.findById(requestId);
        if (!request) {
            throw apiError_1.ApiError.notFound(`Dual approval request ${requestId} was not found`);
        }
        if (request.status !== 'PENDING') {
            throw apiError_1.ApiError.badRequest(`Request is already ${request.status}.`);
        }
        request.status = 'REJECTED';
        request.confirmedByAdminId = new mongoose_1.default.Types.ObjectId(rejectingAdminId);
        request.confirmedByAdminEmail = rejectingAdminEmail;
        request.rejectionReason = rejectionReason.trim();
        request.resolvedAt = new Date();
        await request.save();
        await this.logAction({
            action: 'DUAL_APPROVAL_CONFIRM',
            adminId: rejectingAdminId,
            adminEmail: rejectingAdminEmail,
            targetUserId: request.targetUserId?.toString(),
            targetUserEmail: request.targetUserEmail,
            reason: `Rejected dual-approval request ${request.action}: ${rejectionReason}`,
            targetResourceId: request._id.toString(),
            resourceType: 'DualApproval'
        });
        return request;
    }
    /**
     * List pending and resolved dual approval requests
     */
    async listDualApprovalRequests(status) {
        const query = {};
        if (status)
            query.status = status;
        return DualApproval_1.DualApprovalModel.find(query).sort({ createdAt: -1 });
    }
    /**
     * Super Admin directly provisions staff account (SUPER_ADMIN or MODERATOR) in MongoDB.
     */
    async createStaffUser(adminId, adminEmail, input) {
        const { name, email, phone, password, role, commissionRate, notes, reason } = input;
        if (!name || name.trim() === '') {
            throw apiError_1.ApiError.badRequest('Full Name is required');
        }
        if (!email || !email.includes('@')) {
            throw apiError_1.ApiError.badRequest('Valid email address is required');
        }
        if (!password || password.length < 8) {
            throw apiError_1.ApiError.badRequest('Password must be at least 8 characters long');
        }
        if (!role || (role !== roles_1.UserRole.SUPER_ADMIN && role !== roles_1.UserRole.MODERATOR)) {
            throw apiError_1.ApiError.badRequest('Role must be either SUPER_ADMIN or MODERATOR');
        }
        const normalizedEmail = email.trim().toLowerCase();
        // Check duplicate email
        const existingEmail = await User_1.UserModel.findOne({ email: normalizedEmail });
        if (existingEmail) {
            throw apiError_1.ApiError.conflict(`An account with email ${normalizedEmail} already exists`);
        }
        let normalizedPhone;
        if (phone && phone.trim() !== '') {
            try {
                normalizedPhone = (0, phone_1.normalizePhoneNumber)(phone.trim());
            }
            catch {
                normalizedPhone = phone.trim();
            }
            const existingPhone = await User_1.UserModel.findOne({ phone: normalizedPhone });
            if (existingPhone) {
                throw apiError_1.ApiError.conflict(`An account with phone number ${normalizedPhone} already exists`);
            }
        }
        const passwordHash = await (0, crypto_1.hashPassword)(password);
        // Generate unique referral code
        const prefix = role === roles_1.UserRole.SUPER_ADMIN ? 'ADMIN' : 'MOD';
        const referralCode = `${prefix}_${(0, crypto_1.generateRandomString)(8).toUpperCase()}`;
        let normalizedCommissionRate;
        if (role === roles_1.UserRole.MODERATOR) {
            if (commissionRate !== undefined && commissionRate !== null) {
                const num = Number(commissionRate);
                const decimalRate = num > 1 ? num / 100 : num;
                normalizedCommissionRate = Math.round(Math.min(Math.max(decimalRate, 0.01), 0.90) * 100) / 100;
            }
            else {
                normalizedCommissionRate = 0.50;
            }
        }
        const newUser = await User_1.UserModel.create({
            name: name.trim(),
            email: normalizedEmail,
            phone: normalizedPhone,
            passwordHash,
            role,
            accountStatus: User_1.AccountStatus.ACTIVE,
            isActive: true,
            isEmailVerified: true,
            isPhoneVerified: !!normalizedPhone,
            referralCode,
            moderatorCommissionRate: normalizedCommissionRate,
            moderatorNotes: notes ? notes.trim() : undefined,
            createdByAdminId: new mongoose_1.default.Types.ObjectId(adminId)
        });
        // Record immutable audit trail
        await AuditLog_1.AuditLogModel.create({
            action: role === roles_1.UserRole.SUPER_ADMIN ? 'ROLE_PROMOTION_SUPER_ADMIN' : 'ROLE_PROMOTION_MODERATOR',
            adminId: new mongoose_1.default.Types.ObjectId(adminId),
            adminEmail,
            targetUserId: newUser._id,
            targetUserEmail: newUser.email,
            reason: reason || `Super Admin manually provisioned ${role} account`,
            newValue: {
                userId: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                referralCode: newUser.referralCode
            }
        });
        logger_1.logger.info(`Staff account created by ${adminEmail}: ${newUser.email} (${newUser.role})`);
        return {
            user: {
                _id: newUser._id.toString(),
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                accountStatus: newUser.accountStatus,
                referralCode: newUser.referralCode,
                createdAt: newUser.createdAt
            },
            message: `${role === roles_1.UserRole.SUPER_ADMIN ? 'Administrator' : 'Moderator'} account successfully created and saved to MongoDB!`
        };
    }
}
exports.AdminService = AdminService;
exports.adminService = new AdminService();
//# sourceMappingURL=admin.service.js.map