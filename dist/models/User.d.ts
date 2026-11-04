import mongoose, { Document } from 'mongoose';
import { UserRole } from '../shared/roles';
export declare enum AccountStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    BLOCKED = "BLOCKED",
    DELETED = "DELETED"
}
export interface IUser extends Document {
    name: string;
    email?: string;
    phone?: string;
    passwordHash: string;
    role: UserRole;
    isEmailVerified: boolean;
    isPhoneVerified: boolean;
    isActive: boolean;
    accountStatus: AccountStatus;
    suspendedUntil?: Date;
    statusReason?: string;
    statusChangedAt?: Date;
    statusChangedByAdminId?: mongoose.Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
    deletionReason?: string;
    twoFactorEnabled: boolean;
    twoFactorSecret?: string;
    referralCode?: string;
    referredBy?: mongoose.Types.ObjectId;
    referredAt?: Date;
    referralCodeUsed?: string;
    moderatorCommissionRate?: number;
    moderatorNotes?: string;
    registrationIp?: string;
    lastLoginAt?: Date;
    sessionsRevokedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserModel: mongoose.Model<any, {}, {}, {}, any, any>;
