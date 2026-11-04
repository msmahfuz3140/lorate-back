import mongoose, { Document } from 'mongoose';
export type NotificationType = 'SUBSCRIPTION_ACTIVATED' | 'PAYMENT_FAILED' | 'SUBSCRIPTION_EXPIRING' | 'SUBSCRIPTION_EXPIRED' | 'SUBSCRIPTION_REVOKED' | 'SECURITY_ALERT' | 'PLATFORM_ANNOUNCEMENT';
export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    readAt?: Date;
    link?: string;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const NotificationModel: mongoose.Model<any, {}, {}, {}, any, any>;
