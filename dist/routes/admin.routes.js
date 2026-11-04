"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRoutes = void 0;
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const moderator_controller_1 = require("../controllers/moderator.controller");
const adminSettings_controller_1 = require("../controllers/adminSettings.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const roles_1 = require("../shared/roles");
const router = (0, express_1.Router)();
// Enforce strict server-side authorization for ALL admin endpoints
router.use(auth_middleware_1.requireAuth);
router.use((0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN));
// Dashboard Metrics
router.get('/dashboard-metrics', (req, res, next) => admin_controller_1.adminController.getDashboardMetrics(req, res, next));
// User Management
router.get('/users', (req, res, next) => admin_controller_1.adminController.getUsers(req, res, next));
router.get('/users/:userId', (req, res, next) => admin_controller_1.adminController.getUserDetails(req, res, next));
router.patch('/users/:userId/profile', (req, res, next) => admin_controller_1.adminController.updateUserProfile(req, res, next));
router.post('/users/:userId/status', (req, res, next) => admin_controller_1.adminController.changeUserStatus(req, res, next));
router.delete('/users/:userId', (req, res, next) => admin_controller_1.adminController.softDeleteUser(req, res, next));
// Create Staff User (Super Admin or Moderator) directly into DB
router.post('/users/create-staff', (req, res, next) => admin_controller_1.adminController.createStaffUser(req, res, next));
router.post('/users', (req, res, next) => admin_controller_1.adminController.createStaffUser(req, res, next));
// Moderator Management
router.post('/moderators', (req, res, next) => moderator_controller_1.moderatorController.createModerator(req, res, next));
router.get('/moderators', (req, res, next) => moderator_controller_1.moderatorController.listModerators(req, res, next));
router.get('/moderators/:moderatorId', (req, res, next) => moderator_controller_1.moderatorController.getModeratorDetails(req, res, next));
router.patch('/moderators/:moderatorId/status', (req, res, next) => moderator_controller_1.moderatorController.updateModeratorStatus(req, res, next));
router.post('/moderators/:moderatorId/reset-password', (req, res, next) => moderator_controller_1.moderatorController.resetModeratorPassword(req, res, next));
router.patch('/moderators/:moderatorId/commission-rate', (req, res, next) => moderator_controller_1.moderatorController.updateModeratorCommissionRate(req, res, next));
// Referral & Commission Management
router.get('/referrals/overview', (req, res, next) => moderator_controller_1.moderatorController.getReferralOverview(req, res, next));
router.get('/referrals/commissions', (req, res, next) => moderator_controller_1.moderatorController.listCommissions(req, res, next));
router.post('/referrals/commissions/:commissionId/status', (req, res, next) => moderator_controller_1.moderatorController.updateCommissionStatus(req, res, next));
router.patch('/referrals/commissions/:commissionId/adjust', (req, res, next) => moderator_controller_1.moderatorController.adjustCommission(req, res, next));
router.get('/referrals/export', (req, res, next) => moderator_controller_1.moderatorController.exportCommissionsCsv(req, res, next));
router.get('/referrals/policy', (req, res, next) => moderator_controller_1.moderatorController.getCommissionPolicy(req, res, next));
router.post('/referrals/policy', (req, res, next) => moderator_controller_1.moderatorController.updateGlobalCommissionPolicy(req, res, next));
router.get('/referrals/fraud-alerts', (req, res, next) => moderator_controller_1.moderatorController.getFraudAlerts(req, res, next));
// Audit Logs
router.get('/audit-logs', (req, res, next) => admin_controller_1.adminController.getAuditLogs(req, res, next));
// Dual Approval Governance
router.get('/dual-approvals', (req, res, next) => admin_controller_1.adminController.listDualApprovals(req, res, next));
router.post('/dual-approvals/request', (req, res, next) => admin_controller_1.adminController.requestDualApproval(req, res, next));
router.post('/dual-approvals/:requestId/approve', (req, res, next) => admin_controller_1.adminController.approveDualApproval(req, res, next));
router.post('/dual-approvals/:requestId/reject', (req, res, next) => admin_controller_1.adminController.rejectDualApproval(req, res, next));
// Subscription Plans Management
router.get('/plans', (req, res, next) => adminSettings_controller_1.adminSettingsController.getAdminPlans(req, res, next));
router.post('/plans', (req, res, next) => adminSettings_controller_1.adminSettingsController.createAdminPlan(req, res, next));
router.patch('/plans/:planId', (req, res, next) => adminSettings_controller_1.adminSettingsController.updateAdminPlan(req, res, next));
router.delete('/plans/:planId', (req, res, next) => adminSettings_controller_1.adminSettingsController.deleteAdminPlan(req, res, next));
// Tool Management & Maintenance Mode
router.get('/tool/settings', (req, res, next) => adminSettings_controller_1.adminSettingsController.getAdminToolSettings(req, res, next));
router.patch('/tool/settings', (req, res, next) => adminSettings_controller_1.adminSettingsController.updateToolSettings(req, res, next));
// Website CMS & Branding Settings
router.get('/settings', (req, res, next) => adminSettings_controller_1.adminSettingsController.getAdminWebsiteSettings(req, res, next));
router.put('/settings', (req, res, next) => adminSettings_controller_1.adminSettingsController.updateWebsiteSettings(req, res, next));
// Platform Reports & Safe CSV Exports
router.get('/reports/summary', (req, res, next) => adminSettings_controller_1.adminSettingsController.getReportsSummary(req, res, next));
router.get('/reports/export', (req, res, next) => adminSettings_controller_1.adminSettingsController.exportReportCsv(req, res, next));
router.get('/audit-logs/export', (req, res, next) => {
    req.query.reportType = 'ACTIVITY';
    adminSettings_controller_1.adminSettingsController.exportReportCsv(req, res, next);
});
// Broadcast In-App Announcements
router.post('/notifications/broadcast', (req, res, next) => adminSettings_controller_1.adminSettingsController.broadcastAnnouncement(req, res, next));
// --- Extended Admin Features ---
const adminExtended_controller_1 = require("../controllers/adminExtended.controller");
// Support Tickets
router.get('/tickets', (req, res, next) => adminExtended_controller_1.adminExtendedController.getTickets(req, res, next));
router.get('/tickets/:ticketId', (req, res, next) => adminExtended_controller_1.adminExtendedController.getTicketDetails(req, res, next));
router.post('/tickets/:ticketId/reply', (req, res, next) => adminExtended_controller_1.adminExtendedController.replyTicket(req, res, next));
router.patch('/tickets/:ticketId/status', (req, res, next) => adminExtended_controller_1.adminExtendedController.updateTicketStatus(req, res, next));
router.patch('/tickets/:ticketId/assign', (req, res, next) => adminExtended_controller_1.adminExtendedController.assignTicket(req, res, next));
// Security Operations Center
router.get('/security/overview', (req, res, next) => adminExtended_controller_1.adminExtendedController.getSecurityOverview(req, res, next));
router.get('/security/alerts', (req, res, next) => adminExtended_controller_1.adminExtendedController.getSecurityAlerts(req, res, next));
router.post('/security/revoke-sessions/:userId', (req, res, next) => adminExtended_controller_1.adminExtendedController.revokeUserSessions(req, res, next));
// Roulette Tool Management & Telemetry
router.get('/tool/telemetry', (req, res, next) => adminExtended_controller_1.adminExtendedController.getToolTelemetry(req, res, next));
// AI Admin Assistant (Strict Read-Only)
router.post('/ai-assistant/query', (req, res, next) => adminExtended_controller_1.adminExtendedController.queryAiAssistant(req, res, next));
// Notifications Telemetry & Targeted Delivery
router.get('/notifications/metrics', (req, res, next) => adminExtended_controller_1.adminExtendedController.getNotificationMetrics(req, res, next));
router.post('/notifications/targeted', (req, res, next) => adminExtended_controller_1.adminExtendedController.sendTargetedNotification(req, res, next));
exports.adminRoutes = router;
//# sourceMappingURL=admin.routes.js.map