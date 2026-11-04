"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const admin_service_1 = require("../services/admin.service");
const apiError_1 = require("../utils/apiError");
class AdminController {
    async getDashboardMetrics(req, res, next) {
        try {
            const metrics = await admin_service_1.adminService.getDashboardMetrics();
            res.status(200).json({
                success: true,
                data: metrics
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getUsers(req, res, next) {
        try {
            const { search, role, accountStatus, status, subscriptionStatus, hasActiveSubscription, sub, page, limit } = req.query;
            const cleanString = (val) => {
                if (!val || typeof val !== 'string')
                    return undefined;
                const trimmed = val.trim();
                return (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') ? undefined : trimmed;
            };
            const resolvedAccountStatus = cleanString(accountStatus) || cleanString(status);
            const resolvedRole = cleanString(role);
            const resolvedSearch = cleanString(search);
            let resolvedSubStatus = undefined;
            const rawSub = cleanString(subscriptionStatus) || cleanString(hasActiveSubscription) || cleanString(sub);
            if (rawSub) {
                if (rawSub === 'ACTIVE' || rawSub === 'true' || rawSub === 'active') {
                    resolvedSubStatus = 'ACTIVE';
                }
                else if (rawSub === 'INACTIVE' || rawSub === 'false' || rawSub === 'EXPIRED' || rawSub === 'expired' || rawSub === 'none') {
                    resolvedSubStatus = 'INACTIVE';
                }
                else {
                    resolvedSubStatus = rawSub.toUpperCase();
                }
            }
            const result = await admin_service_1.adminService.getUsers({
                search: resolvedSearch,
                role: resolvedRole,
                accountStatus: resolvedAccountStatus,
                subscriptionStatus: resolvedSubStatus,
                page: page && !isNaN(Number(page)) ? Math.max(1, Number(page)) : 1,
                limit: limit && !isNaN(Number(limit)) ? Math.min(100, Math.max(1, Number(limit))) : 20
            });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getUserDetails(req, res, next) {
        try {
            const { userId } = req.params;
            const result = await admin_service_1.adminService.getUserDetails(userId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateUserProfile(req, res, next) {
        try {
            const { userId } = req.params;
            const { name, phone, isEmailVerified, isPhoneVerified, role, moderatorCommissionRate, moderatorNotes, isActive, reason } = req.body;
            if (!reason || reason.trim().length < 3) {
                throw apiError_1.ApiError.badRequest('A mandatory reason is required for administrative profile changes');
            }
            const updated = await admin_service_1.adminService.updateUserProfile(req.user.id, req.user?.email || 'admin@roulette.tools', userId, { name, phone, isEmailVerified, isPhoneVerified, role, moderatorCommissionRate, moderatorNotes, isActive }, reason);
            res.status(200).json({
                success: true,
                data: updated
            });
        }
        catch (error) {
            next(error);
        }
    }
    async changeUserStatus(req, res, next) {
        try {
            const { userId } = req.params;
            const { action, reason, suspendedUntil } = req.body;
            if (!action || !['BLOCK', 'UNBLOCK', 'SUSPEND'].includes(action)) {
                throw apiError_1.ApiError.badRequest('Action must be one of BLOCK, UNBLOCK, or SUSPEND');
            }
            if (!reason || reason.trim().length < 3) {
                throw apiError_1.ApiError.badRequest('A mandatory reason is required for administrative status changes');
            }
            const parsedDate = suspendedUntil ? new Date(suspendedUntil) : undefined;
            const result = await admin_service_1.adminService.changeUserStatus(req.user.id, req.user?.email || 'admin@roulette.tools', userId, action, reason, parsedDate);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async softDeleteUser(req, res, next) {
        try {
            const { userId } = req.params;
            const { reason } = req.body;
            if (!reason || reason.trim().length < 3) {
                throw apiError_1.ApiError.badRequest('A detailed reason is required for account deletion');
            }
            const result = await admin_service_1.adminService.softDeleteUser(req.user.id, req.user?.email || 'admin@roulette.tools', userId, reason);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAuditLogs(req, res, next) {
        try {
            const { action, adminEmail, targetUserEmail, startDate, endDate, page, limit } = req.query;
            const result = await admin_service_1.adminService.getAuditLogs({
                action: action,
                adminEmail: adminEmail,
                targetUserEmail: targetUserEmail,
                startDate: startDate,
                endDate: endDate,
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 25
            });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    // --- Dual Approval Governance ---
    async listDualApprovals(req, res, next) {
        try {
            const { status } = req.query;
            const result = await admin_service_1.adminService.listDualApprovalRequests(status);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async requestDualApproval(req, res, next) {
        try {
            const { action, payload, reason, targetUserId } = req.body;
            if (!action || !payload || !reason) {
                throw apiError_1.ApiError.badRequest('Action, payload, and reason are required for dual approval request');
            }
            const result = await admin_service_1.adminService.requestDualApproval(req.user.id, req.user?.email || 'admin@roulette.tools', action, payload, reason, targetUserId);
            res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async approveDualApproval(req, res, next) {
        try {
            const { requestId } = req.params;
            const result = await admin_service_1.adminService.approveDualApproval(req.user.id, req.user?.email || 'admin@roulette.tools', requestId);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async rejectDualApproval(req, res, next) {
        try {
            const { requestId } = req.params;
            const { reason } = req.body;
            if (!reason) {
                throw apiError_1.ApiError.badRequest('Rejection reason is required');
            }
            const result = await admin_service_1.adminService.rejectDualApproval(req.user.id, req.user?.email || 'admin@roulette.tools', requestId, reason);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createStaffUser(req, res, next) {
        try {
            const adminId = req.user.id;
            const adminEmail = req.user?.email || 'admin@roulette.tools';
            const result = await admin_service_1.adminService.createStaffUser(adminId, adminEmail, req.body);
            res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
//# sourceMappingURL=admin.controller.js.map