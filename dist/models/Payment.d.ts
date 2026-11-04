import mongoose, { Document } from 'mongoose';
import { PaymentStatus } from '../shared/subscriptions';
import { PlanDuration } from '../shared/plans';
export interface IipnEvent {
    receivedAt: Date;
    paymentStatus: string;
    actuallyPaid?: number;
    rawPayload: Record<string, unknown>;
}
export interface IPayment extends Document {
    userId: mongoose.Types.ObjectId;
    planId: string;
    planName: string;
    priceCents: number;
    priceAmount: number;
    priceCurrency: string;
    duration: PlanDuration;
    durationDays: number;
    payAmount?: number;
    actuallyPaid?: number;
    payCurrency: string;
    paymentId: string;
    orderId: string;
    status: PaymentStatus;
    isFulfilled: boolean;
    subscriptionId?: mongoose.Types.ObjectId;
    failureReason?: string;
    payAddress?: string;
    checkoutUrl?: string;
    referredByModeratorId?: mongoose.Types.ObjectId;
    referralCodeSnapshot?: string;
    commissionRateSnapshot?: number;
    rawIpnData?: Record<string, unknown>;
    ipnHistory: IipnEvent[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const PaymentModel: mongoose.Model<any, {}, {}, {}, any, any>;
