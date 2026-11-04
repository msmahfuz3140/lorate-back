"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notification_service_1 = require("../services/notification.service");
const apiError_1 = require("../utils/apiError");
class NotificationController {
    /**
     * GET /api/v1/notifications
     */
    async getUserNotifications(req, res, next) {
        try {
            const user = req.user;
            if (!user) {
                throw apiError_1.ApiError.unauthorized('Authentication required');
            }
            const { page, limit, unreadOnly } = req.query;
            const data = await notification_service_1.notificationService.getUserNotifications(user.id, {
                page: page ? parseInt(page, 10) : undefined,
                limit: limit ? parseInt(limit, 10) : undefined,
                unreadOnly: unreadOnly === 'true'
            });
            res.status(200).json({ success: true, data });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * PATCH /api/v1/notifications/:id/read
     */
    async markAsRead(req, res, next) {
        try {
            const user = req.user;
            if (!user) {
                throw apiError_1.ApiError.unauthorized('Authentication required');
            }
            const notif = await notification_service_1.notificationService.markAsRead(user.id, req.params.id);
            res.status(200).json({ success: true, data: notif });
        }
        catch (err) {
            next(err);
        }
    }
    /**
     * POST /api/v1/notifications/read-all
     */
    async markAllAsRead(req, res, next) {
        try {
            const user = req.user;
            if (!user) {
                throw apiError_1.ApiError.unauthorized('Authentication required');
            }
            const result = await notification_service_1.notificationService.markAllAsRead(user.id);
            res.status(200).json({ success: true, data: result, message: 'All notifications marked as read' });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
//# sourceMappingURL=notification.controller.js.map