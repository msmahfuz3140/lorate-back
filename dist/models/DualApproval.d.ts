import mongoose, { Document } from 'mongoose';
export type DualApprovalActionType = 'ROLE_PROMOTION_SUPER_ADMIN' | 'GLOBAL_COMMISSION_OVERRIDE' | 'HIGH_VALUE_MANUAL_RECONCILIATION' | 'PLATFORM_OWNERSHIP_CHANGE';
export interface IDualApproval extends Document {
    action: DualApprovalActionType;
    requestedByAdminId: mongoose.Types.ObjectId;
    requestedByAdminEmail: string;
    confirmedByAdminId?: mongoose.Types.ObjectId;
    confirmedByAdminEmail?: string;
    targetUserId?: mongoose.Types.ObjectId;
    targetUserEmail?: string;
    reason: string;
    payload: Record<string, any>;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DualApprovalModel: mongoose.Model<any, {}, {}, {}, any, any>;
