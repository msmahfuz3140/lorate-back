import mongoose, { Document } from 'mongoose';
import { SubscriptionStatus } from '../shared/subscriptions';
export interface ISubscription extends Document {
    userId: mongoose.Types.ObjectId;
    planId: string;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    paymentId?: mongoose.Types.ObjectId;
    providerPaymentId?: string;
    secretCode?: string;
    isSecretCodeClaimed: boolean;
    secretCodeClaimedAt?: Date;
    isApprovedByAdmin: boolean;
    approvedByAdminId?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    isManualGrant: boolean;
    grantReason?: string;
    grantedByAdminId?: mongoose.Types.ObjectId;
    isRevoked: boolean;
    revokedAt?: Date;
    revocationReason?: string;
    extendedAt?: Date;
    extensionReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SubscriptionModel: mongoose.Model<any, {}, {}, {}, any, any>;
