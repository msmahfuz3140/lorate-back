import { IUser } from '../models/User';
import { UserRole } from '../shared/roles';
import mongoose from 'mongoose';
export declare class UserRepository {
    findById(id: string | mongoose.Types.ObjectId): Promise<IUser | null>;
    findByEmail(email: string): Promise<IUser | null>;
    findByPhone(phone: string): Promise<IUser | null>;
    findByIdentifier(identifier: string, altPhone?: string): Promise<IUser | null>;
    findByReferralCode(code: string): Promise<IUser | null>;
    create(data: {
        name?: string;
        email?: string;
        phone?: string;
        passwordHash: string;
        role?: UserRole;
        isEmailVerified?: boolean;
        isPhoneVerified?: boolean;
        isActive?: boolean;
        referralCode?: string;
        referredBy?: mongoose.Types.ObjectId;
        referredAt?: Date;
        referralCodeUsed?: string;
        moderatorCommissionRate?: number;
        moderatorNotes?: string;
        registrationIp?: string;
    }): Promise<IUser>;
    updateVerification(id: string, updates: {
        isEmailVerified?: boolean;
        isPhoneVerified?: boolean;
    }): Promise<IUser | null>;
    updateRole(id: string, role: UserRole): Promise<IUser | null>;
    listModerators(): Promise<IUser[]>;
}
export declare const userRepository: UserRepository;
