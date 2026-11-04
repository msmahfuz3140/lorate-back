"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSettingsController = exports.AdminSettingsController = void 0;
const toolSettings_service_1 = require("../services/toolSettings.service");
const websiteSettings_service_1 = require("../services/websiteSettings.service");
const subscription_service_1 = require("../services/subscription.service");
const reports_service_1 = require("../services/reports.service");
const notification_service_1 = require("../services/notification.service");
const apiError_1 = require("../utils/apiError");
class AdminSettingsController {
    /**
     * GET /api/v1/tool/status
     */
    async getPublicToolStatus(req, res, next) {
        try {
            const data = await toolSettings_service_1.toolSettingsService.getPublicToolStatus();
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/tool/settings
     */
    async getAdminToolSettings(req, res, next) {
        try {
            const data = await toolSettings_service_1.toolSettingsService.getAdminToolSettings();
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PATCH /api/v1/admin/tool/settings
     */
    async updateToolSettings(req, res, next) {
        try {
            const admin = req.user;
            const { isToolEnabled, maintenanceMode, publicStatusMessage, toolVersion, toolAccessPolicy, premiumRequirements, reason } = req.body;
            const data = await toolSettings_service_1.toolSettingsService.updateToolSettings(admin.id, admin.email, {
                isToolEnabled,
                maintenanceMode,
                publicStatusMessage,
                toolVersion,
                toolAccessPolicy,
                premiumRequirements
            }, reason);
            res.status(200).json({ success: true, data, message: 'Tool settings updated successfully' });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/settings/public
     */
    async getPublicWebsiteSettings(req, res, next) {
        try {
            const data = await websiteSettings_service_1.websiteSettingsService.getPublicSettings();
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/settings
     */
    async getAdminWebsiteSettings(req, res, next) {
        try {
            const data = await websiteSettings_service_1.websiteSettingsService.getAdminSettings();
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PUT /api/v1/admin/settings
     */
    async updateWebsiteSettings(req, res, next) {
        try {
            const admin = req.user;
            const { settings, reason } = req.body;
            if (!settings) {
                throw apiError_1.ApiError.badRequest('Settings payload is required');
            }
            const data = await websiteSettings_service_1.websiteSettingsService.updateSettings(admin.id, admin.email, settings, reason || 'Admin updated website configurations');
            res.status(200).json({ success: true, data, message: 'Website settings updated successfully' });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/plans
     */
    async getAdminPlans(req, res, next) {
        try {
            const plans = await subscription_service_1.subscriptionService.getAllPlans();
            res.status(200).json({ success: true, data: plans });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/admin/plans
     */
    async createAdminPlan(req, res, next) {
        try {
            const admin = req.user;
            const created = await subscription_service_1.subscriptionService.createPlan(req.body, admin.id);
            res.status(201).json({ success: true, data: created, message: 'Plan created successfully' });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PATCH /api/v1/admin/plans/:planId
     */
    async updateAdminPlan(req, res, next) {
        try {
            const admin = req.user;
            const planId = req.params.planId;
            const input = req.body;
            const updated = await subscription_service_1.subscriptionService.updatePlan(planId, input, admin.id);
            res.status(200).json({ success: true, data: updated, message: 'Plan updated successfully' });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * DELETE /api/v1/admin/plans/:planId
     */
    async deleteAdminPlan(req, res, next) {
        try {
            const admin = req.user;
            const planId = req.params.planId;
            const result = await subscription_service_1.subscriptionService.deletePlan(planId, admin.id);
            res.status(200).json(result);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/reports/summary
     */
    async getReportsSummary(req, res, next) {
        try {
            const { startDate, endDate, planId, moderatorId, status } = req.query;
            const summary = await reports_service_1.reportsService.getSummaryReport({
                startDate: startDate,
                endDate: endDate,
                planId: planId,
                moderatorId: moderatorId,
                status: status
            });
            res.status(200).json({ success: true, data: summary });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * GET /api/v1/admin/reports/export
     */
    async exportReportCsv(req, res, next) {
        try {
            const { reportType, type: queryType, startDate, endDate, planId, moderatorId, status } = req.query;
            const validTypes = ['REGISTRATIONS', 'SUBSCRIPTIONS', 'SALES', 'MODERATORS', 'ACTIVITY'];
            const rawType = (reportType || queryType);
            const type = rawType?.toUpperCase();
            if (!type || !validTypes.includes(type)) {
                throw apiError_1.ApiError.badRequest(`Invalid reportType. Supported: ${validTypes.join(', ')}`);
            }
            const csv = await reports_service_1.reportsService.exportReportCsv(type, {
                startDate: startDate,
                endDate: endDate,
                planId: planId,
                moderatorId: moderatorId,
                status: status
            });
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="report_${type.toLowerCase()}_${Date.now()}.csv"`);
            res.status(200).send(csv);
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/admin/notifications/broadcast
     */
    async broadcastAnnouncement(req, res, next) {
        try {
            const admin = req.user;
            const { title, message, targetRole } = req.body;
            const result = await notification_service_1.notificationService.broadcastAnnouncement(admin.id, admin.email, title, message, targetRole);
            res.status(200).json({ success: true, data: result, message: 'Broadcast announcement sent successfully' });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdminSettingsController = AdminSettingsController;
exports.adminSettingsController = new AdminSettingsController();
//# sourceMappingURL=adminSettings.controller.js.map