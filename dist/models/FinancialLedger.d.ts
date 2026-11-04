import mongoose, { Document } from 'mongoose';
export interface IFinancialLedger extends Document {
    userId: mongoose.Types.ObjectId;
    orderId: string;
    paymentId: string;
    subscriptionId?: mongoose.Types.ObjectId;
    planId: string;
    type: 'SUBSCRIPTION_PURCHASE' | 'REFUND' | 'ADJUSTMENT';
    amountCents: number;
    amountUsd: number;
    payAmount?: number;
    actuallyPaid?: number;
    payCurrency: string;
    status: 'SETTLED' | 'PENDING' | 'FAILED';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare const FinancialLedgerModel: mongoose.Model<any, {}, {}, {}, any, any>;
