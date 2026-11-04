"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Notification_1 = require("../models/Notification");
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
const apiError_1 = require("../utils/apiError");
const roles_1 = require("../shared/roles");
const logger_1 = require("../utils/logger");
class NotificationService {
    /**
     * Create an in-app notification for a user
     */
    async createNotification(userId, type, title, message, link, metadata) {
        try {
            const notif = await Notification_1.NotificationModel.create({
                userId: new mongoose_1.default.Types.ObjectId(userId.toString()),
                type,
                title,
                message,
                link,
                metadata
            });
            return notif;
        }
        catch (err) {
            logger_1.logger.error('Failed to create notification', { userId, type, error: err });
            throw err;
        }
    }
    /**
     * Fetch paginated notifications for authenticated user
     */
    async getUserNotifications(userId, options = {}) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(50, Math.max(1, options.limit || 15));
        const skip = (page - 1) * limit;
        const query = {
            userId: new mongoose_1.default.Types.ObjectId(userId)
        };
        if (options.unreadOnly) {
            query.isRead = false;
        }
        const [notifications, total, unreadCount] = await Promise.all([
            Notification_1.NotificationModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Notification_1.NotificationModel.countDocuments(query),
            Notification_1.NotificationModel.countDocuments({
                userId: new mongoose_1.default.Types.ObjectId(userId),
                isRead: false
            })
        ]);
        return {
            notifications,
            total,
            unreadCount,
            page,
            totalPages: Math.ceil(total / limit) || 1
        };
    }
    /**
     * Mark a single notification as read
     */
    async markAsRead(userId, notificationId) {
        const notif = await Notification_1.NotificationModel.findOne({
            _id: notificationId,
            userId: new mongoose_1.default.Types.ObjectId(userId)
        });
        if (!notif) {
            throw apiError_1.ApiError.notFound('Notification not found');
        }
        if (!notif.isRead) {
            notif.isRead = true;
            notif.readAt = new Date();
            await notif.save();
        }
        return notif;
    }
    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        const res = await Notification_1.NotificationModel.updateMany({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            isRead: false
        }, {
            $set: {
                isRead: true,
                readAt: new Date()
            }
        });
        return { modifiedCount: res.modifiedCount };
    }
    /**
     * Broadcast announcement from Main Admin to platform users
     */
    async broadcastAnnouncement(adminId, adminEmail, title, message, targetRole) {
        const admin = await User_1.UserModel.findById(adminId);
        if (!admin || admin.role !== roles_1.UserRole.SUPER_ADMIN) {
            throw apiError_1.ApiError.forbidden('Only authorized Main Admins can broadcast announcements');
        }
        if (!title || title.trim() === '') {
            throw apiError_1.ApiError.badRequest('Announcement title is required');
        }
        if (!message || message.trim() === '') {
            throw apiError_1.ApiError.badRequest('Announcement message is required');
        }
        const query = { isDeleted: false };
        if (targetRole) {
            query.role = targetRole;
        }
        const users = await User_1.UserModel.find(query).select('_id');
        const docs = users.map((u) => ({
            userId: u._id,
            type: 'PLATFORM_ANNOUNCEMENT',
            title: title.trim(),
            message: message.trim(),
            isRead: false
        }));
        if (docs.length > 0) {
            await Notification_1.NotificationModel.insertMany(docs);
        }
        await AuditLog_1.AuditLogModel.create({
            action: 'BROADCAST_ANNOUNCEMENT',
            adminId: new mongoose_1.default.Types.ObjectId(adminId),
            adminEmail,
            reason: `Broadcast announcement sent to ${docs.length} users (${targetRole || 'ALL'})`,
            details: { title, recipientCount: docs.length, targetRole }
        });
        logger_1.logger.info(`Main Admin ${adminEmail} broadcast announcement "${title}" to ${docs.length} recipients`);
        return { recipientCount: docs.length };
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map