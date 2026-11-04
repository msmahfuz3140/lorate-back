import { IUser, AccountStatus } from '../models/User';
import { IReferralCommission, CommissionStatus } from '../models/ReferralCommission';
export interface CreateModeratorInput {
    name: string;
    email: string;
    phone?: string;
    password: string;
    commissionRate?: number;
    notes?: string;
}
export interface ModeratorPerformanceSummary {
    moderatorId: string;
    name: string;
    email: string;
    phone?: string;
    referralCode: string;
    referralLink: string;
    accountStatus: AccountStatus;
    isActive: boolean;
    commissionRate: number;
    totalReferrals: number;
    qualifiedCustomers: number;
    totalSalesCount: number;
    totalAttributedRevenueUsd: number;
    pendingCommissionUsd: number;
    eligibleCommissionUsd: number;
    approvedCommissionUsd: number;
    reversedCommissionUsd: number;
    createdAt: Date;
}
export declare class ModeratorService {
    /**
     * Helper: Generate a unique, unguessable referral code for a Moderator.
     * Format: MOD_<8 random hex chars uppercase>, e.g. MOD_8F2A9C1D
     */
    generateUniqueModeratorReferralCode(): Promise<string>;
    /**
     * Helper: Privacy mask for customer email / phone
     */
    private maskIdentifier;
    /**
     * 1. Create a Moderator account
     */
    createModerator(adminId: string, adminEmail: string, input: CreateModeratorInput): Promise<{
        moderator: Partial<IUser>;
        referralCode: string;
        temporaryPassword?: string;
    }>;
    /**
     * 2. List all Moderators with aggregated referral performance
     */
    listModerators(options: {
        search?: string;
        status?: string;
        page?: number;
        limit?: number;
        baseUrl?: string;
    }): Promise<{
        moderators: ModeratorPerformanceSummary[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * 3. Get detailed Moderator profile and performance
     */
    getModeratorDetails(moderatorId: string, baseUrl?: string): Promise<any>;
    /**
     * 4. Update Moderator account status (Activate / Deactivate / Suspend)
     */
    updateModeratorStatus(adminId: string, adminEmail: string, moderatorId: string, status: AccountStatus, reason: string, suspendedUntil?: Date): Promise<IUser>;
    /**
     * 5. Reset Moderator access credentials
     */
    resetModeratorPassword(adminId: string, adminEmail: string, moderatorId: string, newPassword?: string, reason?: string): Promise<{
        temporaryPassword?: string;
    }>;
    /**
     * 6. Update Moderator commission rate for FUTURE eligible sales
     * (Preserves historical snapshots; does NOT rewrite past commissions)
     */
    updateModeratorCommissionRate(adminId: string, adminEmail: string, moderatorId: string, newRate: number, reason: string): Promise<{
        moderatorId: string;
        previousRate: number;
        newRate: number;
    }>;
    /**
     * 7. Global referral performance overview
     */
    getReferralOverview(): Promise<any>;
    /**
     * 8. List and search commissions across the platform
     */
    listCommissions(query: {
        moderatorId?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        commissions: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * 9. Transition Commission state (Approve, Reverse, etc.) with mandatory audit reason
     */
    updateCommissionStatus(adminId: string, adminEmail: string, commissionId: string, newStatus: CommissionStatus, reason: string): Promise<IReferralCommission>;
    /**
     * 9b. Manual Commission Adjustment (with mandatory audit reason and logging)
     */
    adjustCommission(adminId: string, adminEmail: string, commissionId: string, input: {
        newAmountUsd?: number;
        newStatus?: CommissionStatus;
        reason: string;
        notes?: string;
    }): Promise<IReferralCommission>;
    /**
     * 10. Export Commissions report to CSV
     */
    exportCommissionsCsv(query: {
        moderatorId?: string;
        status?: string;
    }): Promise<string>;
    /**
     * 11. Update Global Commission Policy (future sales default rate)
     */
    updateGlobalCommissionPolicy(adminId: string, adminEmail: string, newRate: number, reason: string): Promise<any>;
    /**
     * 12. Review suspected referral fraud alerts
     */
    getReferralFraudAlerts(): Promise<any[]>;
    /**
     * 13. Moderator Self-Dashboard
     */
    getModeratorSelfDashboard(moderatorUserId: string, origin?: string): Promise<any>;
    /**
     * 14. Moderator Self-Commissions List (Paginated)
     */
    getModeratorSelfCommissions(moderatorUserId: string, options: {
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<any>;
    /**
     * 15. Moderator Self-Referred Customers List (Privacy Masked)
     */
    getModeratorSelfReferredUsers(moderatorUserId: string, page?: number, limit?: number): Promise<any>;
}
export declare const moderatorService: ModeratorService;
