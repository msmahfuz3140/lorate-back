"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderatorController = exports.ModeratorController = void 0;
const moderator_service_1 = require("../services/moderator.service");
class ModeratorController {
    // =========================================================================
    // MAIN ADMIN ENDPOINTS
    // =========================================================================
    /**
     * POST /api/v1/admin/moderators
     */
    async createModerator(req, res, next) {
        try {
            const adminId = req.user.id;
            const adminEmail = req.user.email;
            const result = await moderator_service_1.moderatorService.createModerator(adminId, adminEmail, req.body);
            res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/moderators
     */
    async listModerators(req, res, next) {
        try {
            const { search, status, page, limit } = req.query;
            const origin = `${req.protocol}://${req.get('host')}`;
            const result = await moderator_service_1.moderatorService.listModerators({
                search: search,
                status: status,
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined,
                baseUrl: origin
            });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/moderators/:moderatorId
     */
    async getModeratorDetails(req, res, next) {
        try {
            const moderatorId = req.params.moderatorId;
            const origin = `${req.protocol}://${req.get('host')}`;
            const result = await moderator_service_1.moderatorService.getModeratorDetails(moderatorId, origin);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PATCH /api/v1/admin/moderators/:moderatorId/status
     */
    async updateModeratorStatus(req, res, next) {
        try {
            const adminId = req.user.id;
            const adminEmail = req.user.email;
            const moderatorId = req.params.moderatorId;
            const { status, reason, suspendedUntil } = req.body;
            const result = await moderator_service_1.moderatorService.updateModeratorStatus(adminId, adminEmail, moderatorId, status, reason, suspendedUntil ? new Date(suspendedUntil) : undefined);
            res.status(200).json({
                success: true,
                data: {
                    moderatorId: result._id.toString(),
                    accountStatus: result.accountStatus,
                    isActive: result.isActive
                }
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/admin/moderators/:moderatorId/reset-password
     */
    async resetModeratorPassword(req, res, next) {
        try {
            const adminId = req.user.id;
            const adminEmail = req.user.email;
            const moderatorId = req.params.moderatorId;
            const { newPassword, reason } = req.body;
            const result = await moderator_service_1.moderatorService.resetModeratorPassword(adminId, adminEmail, moderatorId, newPassword, reason);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PATCH /api/v1/admin/moderators/:moderatorId/commission-rate
     */
    async updateModeratorCommissionRate(req, res, next) {
        try {
            const adminId = req.user.id;
            const adminEmail = req.user.email;
            const moderatorId = req.params.moderatorId;
            const { commissionRate, reason } = req.body;
            const result = await moderator_service_1.moderatorService.updateModeratorCommissionRate(adminId, adminEmail, moderatorId, parseFloat(commissionRate), reason);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/referrals/overview
     */
    async getReferralOverview(req, res, next) {
        try {
            const result = await moderator_service_1.moderatorService.getReferralOverview();
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/referrals/commissions
     */
    async listCommissions(req, res, next) {
        try {
            const { moderatorId, status, search, page, limit } = req.query;
            const result = await moderator_service_1.moderatorService.listCommissions({
                moderatorId: moderatorId,
                status: status,
                search: search,
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined
            });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/admin/referrals/commissions/:commissionId/status
     */
    async updateCommissionStatus(req, res, next) {
        try {
            const adminId = req.user.id;
            const adminEmail = req.user.email;
            const commissionId = req.params.commissionId;
            const { status, reason } = req.body;
            const result = await moderator_service_1.moderatorService.updateCommissionStatus(adminId, adminEmail, commissionId, status, reason);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PATCH /api/v1/admin/referrals/commissions/:commissionId/adjust
     */
    async adjustCommission(req, res, next) {
        try {
            const adminId = req.user.id;
            const adminEmail = req.user.email;
            const commissionId = req.params.commissionId;
            const { newAmountUsd, newStatus, reason, notes } = req.body;
            const result = await moderator_service_1.moderatorService.adjustCommission(adminId, adminEmail, commissionId, {
                newAmountUsd: newAmountUsd !== undefined ? Number(newAmountUsd) : undefined,
                newStatus: newStatus,
                reason,
                notes
            });
            res.status(200).json({
                success: true,
                data: result,
                message: 'Commission record adjusted and audited successfully'
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/referrals/export
     */
    async exportCommissionsCsv(req, res, next) {
        try {
            const { moderatorId, status } = req.query;
            const csv = await moderator_service_1.moderatorService.exportCommissionsCsv({
                moderatorId: moderatorId,
                status: status
            });
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="commissions-report.csv"');
            res.status(200).send(csv);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/referrals/policy
     */
    async getCommissionPolicy(req, res, next) {
        try {
            const overview = await moderator_service_1.moderatorService.getReferralOverview();
            res.status(200).json({
                success: true,
                data: overview.globalCommissionPolicy
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/admin/referrals/policy
     */
    async updateGlobalCommissionPolicy(req, res, next) {
        try {
            const adminId = req.user.id;
            const adminEmail = req.user.email;
            const { defaultRate, reason } = req.body;
            const result = await moderator_service_1.moderatorService.updateGlobalCommissionPolicy(adminId, adminEmail, parseFloat(defaultRate), reason);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/referrals/fraud-alerts
     */
    async getFraudAlerts(req, res, next) {
        try {
            const result = await moderator_service_1.moderatorService.getReferralFraudAlerts();
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    // =========================================================================
    // MODERATOR SELF DASHBOARD ENDPOINTS (MODERATOR ONLY)
    // =========================================================================
    /**
     * GET /api/v1/moderator/dashboard
     */
    async getModeratorSelfDashboard(req, res, next) {
        try {
            const moderatorUserId = req.user.id;
            const origin = `${req.protocol}://${req.get('host')}`;
            const result = await moderator_service_1.moderatorService.getModeratorSelfDashboard(moderatorUserId, origin);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/moderator/commissions
     */
    async getModeratorSelfCommissions(req, res, next) {
        try {
            const moderatorUserId = req.user.id;
            const { status, page, limit } = req.query;
            const result = await moderator_service_1.moderatorService.getModeratorSelfCommissions(moderatorUserId, {
                status: status,
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined
            });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/moderator/referred-users
     */
    async getModeratorSelfReferredUsers(req, res, next) {
        try {
            const moderatorUserId = req.user.id;
            const { page, limit } = req.query;
            const result = await moderator_service_1.moderatorService.getModeratorSelfReferredUsers(moderatorUserId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ModeratorController = ModeratorController;
exports.moderatorController = new ModeratorController();
//# sourceMappingURL=moderator.controller.js.map