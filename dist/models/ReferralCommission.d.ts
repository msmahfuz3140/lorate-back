import mongoose, { Document } from 'mongoose';
export type CommissionStatus = 'PENDING' | 'ELIGIBLE' | 'APPROVED' | 'CREDITED' | 'REVERSED';
export interface IReversalDetails {
    reversedAt: Date;
    reversedByAdminId?: mongoose.Types.ObjectId;
    reversedByAdminEmail?: string;
    reason: string;
}
export interface IReferralCommission extends Document {
    moderatorId: mongoose.Types.ObjectId;
    referredUserId: mongoose.Types.ObjectId;
    subscriptionId?: mongoose.Types.ObjectId;
    paymentId: mongoose.Types.ObjectId;
    purchaseId?: string;
    subscriptionPlan?: string;
    originalPurchaseAmount?: number;
    commissionableAmount?: number;
    commissionRate: number;
    amountUsd: number;
    status: CommissionStatus;
    reversalDetails?: IReversalDetails;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const ReferralCommissionModel: mongoose.Model<any, {}, {}, {}, any, any>;
