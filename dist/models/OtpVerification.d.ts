import mongoose, { Document } from 'mongoose';
import { OtpPurpose } from '../shared/auth';
export interface IOtpVerification extends Document {
    target: string;
    codeHash: string;
    rawCodeDev?: string;
    purpose: OtpPurpose;
    expiresAt: Date;
    lastSentAt: Date;
    isUsed: boolean;
    attempts: number;
    ip?: string;
    createdAt: Date;
}
export declare const OtpVerificationModel: mongoose.Model<any, {}, {}, {}, any, any>;
