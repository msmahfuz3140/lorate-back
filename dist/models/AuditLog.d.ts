import mongoose, { Document } from 'mongoose';
export type AuditActionType = 'USER_BLOCK' | 'USER_UNBLOCK' | 'USER_SUSPEND' | 'USER_PROFILE_EDIT' | 'USER_SOFT_DELETE' | 'SUBSCRIPTION_MANUAL_GRANT' | 'SUBSCRIPTION_EXTEND' | 'SUBSCRIPTION_REVOKE' | 'PLAN_PRICE_UPDATE' | 'MODERATOR_ROLE_CHANGE' | 'COMMISSION_CONFIG_UPDATE' | 'MANUAL_PAYMENT_RECONCILE' | 'DUAL_APPROVAL_REQUEST' | 'DUAL_APPROVAL_CONFIRM' | 'SECURITY_LOGIN' | 'MODERATOR_CREATE' | 'MODERATOR_STATUS_CHANGE' | 'MODERATOR_RESET_PASSWORD' | 'COMMISSION_POLICY_UPDATE' | 'COMMISSION_STATUS_CHANGE' | 'COMMISSION_ADJUSTMENT' | 'REFERRAL_ATTRIBUTION' | 'REFERRAL_FRAUD_FLAG' | 'TOOL_SETTINGS_UPDATE' | 'WEBSITE_SETTINGS_UPDATE' | 'PLAN_CONFIG_UPDATE' | 'BROADCAST_ANNOUNCEMENT' | 'MAIN_ADMIN_BOOTSTRAP';
export interface IAuditLog extends Document {
    action: AuditActionType;
    adminId: mongoose.Types.ObjectId;
    adminEmail: string;
    targetUserId?: mongoose.Types.ObjectId;
    targetUserEmail?: string;
    targetResourceId?: string;
    resourceType?: string;
    reason: string;
    previousValue?: any;
    newValue?: any;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
export declare const AuditLogModel: mongoose.Model<any, {}, {}, {}, any, any>;
