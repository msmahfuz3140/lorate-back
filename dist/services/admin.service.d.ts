import { IUser } from '../models/User';
import { IAuditLog, AuditActionType } from '../models/AuditLog';
import { IDualApproval, DualApprovalActionType } from '../models/DualApproval';
import { UserRole } from '../shared/roles';
export interface AdminDashboardMetrics {
    totalRegisteredUsers: number;
    activeUsers: number;
    blockedUsers: number;
    suspendedUsers: number;
    deletedUsers: number;
    activeSubscriptions: number;
    expiredSubscriptions: number;
    confirmedPaymentCount: number;
    pendingPaymentCount: number;
    moderatorsCount: number;
    financials: {
        grossSalesUsd: number;
        refundsUsd: number;
        estimatedPaymentFeesUsd: number;
        outstandingCommissionLiabilitiesUsd: number;
        netRevenueUsd: number;
        referralAttributedSalesUsd: number;
    };
    planDistribution: Record<string, number>;
    recentAuditActivities: any[];
}
export interface UserManagementFilter {
    search?: string;
    role?: string;
    accountStatus?: string;
    subscriptionStatus?: string;
    page?: number;
    limit?: number;
}
export declare class AdminService {
    /**
     * Log an immutable administrative action for compliance and security auditing
     */
    logAction(params: {
        action: AuditActionType;
        adminId: string;
        adminEmail: string;
        reason: string;
        targetUserId?: string;
        targetUserEmail?: string;
        targetResourceId?: string;
        resourceType?: string;
        previousValue?: any;
        newValue?: any;
        details?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<IAuditLog>;
    /**
     * Fetch comprehensive platform metrics with transparent financial breakdown
     */
    getDashboardMetrics(): Promise<AdminDashboardMetrics>;
    /**
     * Search, filter, and paginate platform users
     */
    getUsers(filter: UserManagementFilter): Promise<{
        users: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        summary: {
            totalUsers: number;
            totalAdmins: number;
            totalMods: number;
            totalActiveSubs: number;
        };
    }>;
    /**
     * Get single user detailed profile, payment records, subscription history, and audit log
     */
    getUserDetails(userId: string): Promise<any>;
    /**
     * Edit permitted profile attributes (name, phone, role, commission) with mandatory audit logging
     */
    updateUserProfile(adminId: string, adminEmail: string, userId: string, input: {
        name?: string;
        phone?: string;
        isEmailVerified?: boolean;
        isPhoneVerified?: boolean;
        role?: UserRole;
        moderatorCommissionRate?: number;
        moderatorNotes?: string;
        isActive?: boolean;
    }, reason: string): Promise<IUser>;
    /**
     * Change user account status (BLOCK, UNBLOCK, SUSPEND)
     */
    changeUserStatus(adminId: string, adminEmail: string, userId: string, action: 'BLOCK' | 'UNBLOCK' | 'SUSPEND', reason: string, suspendedUntil?: Date): Promise<IUser>;
    /**
     * Delete user account permanently from MongoDB while preserving audit logs
     */
    softDeleteUser(adminId: string, adminEmail: string, userId: string, reason: string): Promise<any>;
    /**
     * Fetch paginated audit logs with action and date filters
     */
    getAuditLogs(filter: {
        action?: string;
        adminEmail?: string;
        targetUserEmail?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        logs: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Submit a high-risk administrative action for secondary confirmation
     */
    requestDualApproval(adminId: string, adminEmail: string, action: DualApprovalActionType, payload: Record<string, any>, reason: string, targetUserId?: string): Promise<IDualApproval>;
    /**
     * Confirm and execute a dual approval request by a second distinct Main Admin
     */
    approveDualApproval(confirmingAdminId: string, confirmingAdminEmail: string, requestId: string): Promise<{
        success: boolean;
        request: IDualApproval;
        result?: any;
    }>;
    /**
     * Reject a pending dual approval request
     */
    rejectDualApproval(rejectingAdminId: string, rejectingAdminEmail: string, requestId: string, rejectionReason: string): Promise<IDualApproval>;
    /**
     * List pending and resolved dual approval requests
     */
    listDualApprovalRequests(status?: string): Promise<IDualApproval[]>;
    /**
     * Super Admin directly provisions staff account (SUPER_ADMIN or MODERATOR) in MongoDB.
     */
    createStaffUser(adminId: string, adminEmail: string, input: {
        name: string;
        email: string;
        phone?: string;
        password: string;
        role: UserRole.SUPER_ADMIN | UserRole.MODERATOR;
        commissionRate?: number;
        notes?: string;
        reason?: string;
    }): Promise<{
        user: any;
        message: string;
    }>;
}
export declare const adminService: AdminService;
