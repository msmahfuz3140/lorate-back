import mongoose from 'mongoose';
import { NotificationType, INotification } from '../models/Notification';
import { UserRole } from '../shared/roles';
export declare class NotificationService {
    /**
     * Create an in-app notification for a user
     */
    createNotification(userId: string | mongoose.Types.ObjectId, type: NotificationType, title: string, message: string, link?: string, metadata?: Record<string, any>): Promise<INotification>;
    /**
     * Fetch paginated notifications for authenticated user
     */
    getUserNotifications(userId: string, options?: {
        page?: number;
        limit?: number;
        unreadOnly?: boolean;
    }): Promise<{
        notifications: INotification[];
        total: number;
        unreadCount: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * Mark a single notification as read
     */
    markAsRead(userId: string, notificationId: string): Promise<INotification>;
    /**
     * Mark all notifications as read for a user
     */
    markAllAsRead(userId: string): Promise<{
        modifiedCount: number;
    }>;
    /**
     * Broadcast announcement from Main Admin to platform users
     */
    broadcastAnnouncement(adminId: string, adminEmail: string, title: string, message: string, targetRole?: UserRole): Promise<{
        recipientCount: number;
    }>;
}
export declare const notificationService: NotificationService;
