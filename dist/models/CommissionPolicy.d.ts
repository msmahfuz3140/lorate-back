import mongoose, { Document } from 'mongoose';
export interface ICommissionPolicy extends Document {
    defaultRate: number;
    commissionableBasis: string;
    description: string;
    updatedByAdminId?: mongoose.Types.ObjectId;
    updatedByAdminEmail?: string;
    auditReason?: string;
    effectiveFrom: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface CommissionPolicyModelType extends mongoose.Model<ICommissionPolicy> {
    getActivePolicy(): Promise<ICommissionPolicy>;
}
export declare const CommissionPolicyModel: CommissionPolicyModelType;
