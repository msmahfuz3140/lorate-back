"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminExtendedController = exports.AdminExtendedController = void 0;
const supportTicket_service_1 = require("../services/supportTicket.service");
const security_service_1 = require("../services/security.service");
const toolAdmin_service_1 = require("../services/toolAdmin.service");
const aiAssistant_service_1 = require("../services/aiAssistant.service");
const Notification_1 = require("../models/Notification");
const User_1 = require("../models/User");
const Subscription_1 = require("../models/Subscription");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
class AdminExtendedController {
    // --- Support Tickets ---
    async getTickets(req, res, next) {
        try {
            const { status, priority, category, search, page, limit } = req.query;
            const result = await supportTicket_service_1.supportTicketService.getTickets({
                status: status,
                priority: priority,
                category: category,
                search: search,
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 20
            });
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    async getTicketDetails(req, res, next) {
        try {
            const rawId = req.params.ticketId;
            const ticketId = Array.isArray(rawId) ? rawId[0] : (rawId || '');
            const ticket = await supportTicket_service_1.supportTicketService.getTicketById(ticketId);
            res.status(200).json({ success: true, data: ticket });
        }
        catch (error) {
            next(error);
        }
    }
    async replyTicket(req, res, next) {
        try {
            const rawId = req.params.ticketId;
            const ticketId = Array.isArray(rawId) ? rawId[0] : (rawId || '');
            const { message, isInternalNote } = req.body;
            if (!message || message.trim().length < 2) {
                throw apiError_1.ApiError.badRequest('Reply message is required.');
            }
            const updated = await supportTicket_service_1.supportTicketService.addReply({
                ticketId,
                senderId: req.user.id,
                senderEmail: req.user.email || 'admin@roulette.tools',
                senderRole: req.user.role,
                message,
                isInternalNote: !!isInternalNote
            });
            res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
    async updateTicketStatus(req, res, next) {
        try {
            const rawId = req.params.ticketId;
            const ticketId = Array.isArray(rawId) ? rawId[0] : (rawId || '');
            const { status, reason } = req.body;
            if (!['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
                throw apiError_1.ApiError.badRequest('Invalid ticket status');
            }
            const updated = await supportTicket_service_1.supportTicketService.updateStatus(ticketId, status, req.user.email || 'admin@roulette.tools', req.user.id, reason);
            res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
    async assignTicket(req, res, next) {
        try {
            const rawId = req.params.ticketId;
            const ticketId = Array.isArray(rawId) ? rawId[0] : (rawId || '');
            const { adminId } = req.body;
            if (!adminId) {
                throw apiError_1.ApiError.badRequest('adminId is required');
            }
            const updated = await supportTicket_service_1.supportTicketService.assignAdmin(ticketId, adminId, req.user.email || 'admin@roulette.tools');
            res.status(200).json({ success: true, data: updated });
        }
        catch (error) {
            next(error);
        }
    }
    // --- Security Operations Center ---
    async getSecurityOverview(req, res, next) {
        try {
            const overview = await security_service_1.securityService.getSecurityOverview();
            res.status(200).json({ success: true, data: overview });
        }
        catch (error) {
            next(error);
        }
    }
    async getSecurityAlerts(req, res, next) {
        try {
            const alerts = await security_service_1.securityService.getSecurityAlerts();
            res.status(200).json({ success: true, data: alerts });
        }
        catch (error) {
            next(error);
        }
    }
    async revokeUserSessions(req, res, next) {
        try {
            const rawId = req.params.userId;
            const userId = Array.isArray(rawId) ? rawId[0] : (rawId || '');
            const { reason } = req.body;
            if (!reason || reason.trim().length < 3) {
                throw apiError_1.ApiError.badRequest('A mandatory reason is required to revoke user sessions.');
            }
            const result = await security_service_1.securityService.revokeUserSessions(req.user.id, req.user.email || 'admin@roulette.tools', userId, reason);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    // --- Tool Telemetry ---
    async getToolTelemetry(req, res, next) {
        try {
            const telemetry = await toolAdmin_service_1.toolAdminService.getToolTelemetry();
            res.status(200).json({ success: true, data: telemetry });
        }
        catch (error) {
            next(error);
        }
    }
    // --- AI Admin Assistant ---
    async queryAiAssistant(req, res, next) {
        try {
            const { query } = req.body;
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                throw apiError_1.ApiError.badRequest('Query text is required.');
            }
            const result = await aiAssistant_service_1.aiAssistantService.processQuery(query);
            res.status(200).json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
    // --- Notifications Management & Telemetry ---
    async getNotificationMetrics(req, res, next) {
        try {
            const [totalCount, unreadCount, recentNotifications] = await Promise.all([
                Notification_1.NotificationModel.countDocuments(),
                Notification_1.NotificationModel.countDocuments({ isRead: false }),
                Notification_1.NotificationModel.find().sort({ createdAt: -1 }).limit(30)
            ]);
            res.status(200).json({
                success: true,
                data: {
                    totalCount,
                    unreadCount,
                    readRatePercent: totalCount > 0 ? Math.round(((totalCount - unreadCount) / totalCount) * 100) : 100,
                    recentNotifications
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async sendTargetedNotification(req, res, next) {
        try {
            const { title, message, targetType, targetUserId, link } = req.body;
            if (!title || !message) {
                throw apiError_1.ApiError.badRequest('Title and message are required.');
            }
            let recipientUserIds = [];
            if (targetType === 'SINGLE_USER' && targetUserId) {
                recipientUserIds = [targetUserId];
            }
            else if (targetType === 'PREMIUM_ONLY') {
                const activeSubs = await Subscription_1.SubscriptionModel.find({
                    status: 'ACTIVE',
                    isRevoked: { $ne: true },
                    endDate: { $gt: new Date() }
                }).select('userId');
                recipientUserIds = activeSubs.map(s => s.userId);
            }
            else if (targetType === 'EXPIRING_SOON') {
                const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                const expiringSubs = await Subscription_1.SubscriptionModel.find({
                    status: 'ACTIVE',
                    isRevoked: { $ne: true },
                    endDate: { $gte: new Date(), $lte: in7Days }
                }).select('userId');
                recipientUserIds = expiringSubs.map(s => s.userId);
            }
            else {
                const allUsers = await User_1.UserModel.find({ isDeleted: { $ne: true } }).select('_id');
                recipientUserIds = allUsers.map(u => u._id);
            }
            const docs = recipientUserIds.map(uid => ({
                userId: uid,
                type: 'PLATFORM_ANNOUNCEMENT',
                title: title.trim(),
                message: message.trim(),
                link: link || undefined,
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }));
            if (docs.length > 0) {
                await Notification_1.NotificationModel.insertMany(docs);
            }
            logger_1.logger.info(`Targeted announcement sent to ${docs.length} recipients by ${req.user?.email}`);
            res.status(200).json({
                success: true,
                data: {
                    recipientsCount: docs.length,
                    deliveredAt: new Date().toISOString()
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminExtendedController = AdminExtendedController;
exports.adminExtendedController = new AdminExtendedController();
//# sourceMappingURL=adminExtended.controller.js.map