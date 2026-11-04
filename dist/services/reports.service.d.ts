/**
 * Neutralizes spreadsheet formula injection (CSV Injection).
 * If a cell begins with '=', '+', '-', '@', '\t', or '\r', it is prefixed with a single quote (').
 * Also escapes double quotes according to RFC 4180.
 */
export declare function sanitizeCsvCell(value: any): string;
export interface ReportsFilter {
    startDate?: string;
    endDate?: string;
    planId?: string;
    moderatorId?: string;
    status?: string;
}
export interface PlatformReportsSummary {
    period: {
        startDate?: string;
        endDate?: string;
    };
    users: {
        totalRegistrations: number;
        activeUsers: number;
        blockedUsers: number;
        suspendedUsers: number;
        moderatorsCount: number;
    };
    subscriptions: {
        totalActive: number;
        totalExpired: number;
        totalRevoked: number;
        planDistribution: Array<{
            planId: string;
            planName: string;
            activeCount: number;
            percentage: number;
        }>;
    };
    finances: {
        grossSalesUsd: number;
        refundsUsd: number;
        estimatedFeesUsd: number;
        netRevenueUsd: number;
        confirmedOrdersCount: number;
        failedOrdersCount: number;
        refundedOrdersCount: number;
        pendingCommissionLiabilitiesUsd: number;
        approvedCommissionLiabilitiesUsd: number;
        reversedCommissionsUsd: number;
        disclaimer: string;
    };
    moderatorPerformance: Array<{
        moderatorId: string;
        name: string;
        email: string;
        referralCode: string;
        attributedCustomers: number;
        attributedSalesCount: number;
        attributedRevenueUsd: number;
        creditedCommissionUsd: number;
    }>;
}
export declare class ReportsService {
    /**
     * Generates comprehensive platform analytical report with strict financial definition compliance
     */
    getSummaryReport(filters?: ReportsFilter): Promise<PlatformReportsSummary>;
    /**
     * Export reports to CSV format with formula injection protection and sensitive data masking
     */
    exportReportCsv(reportType: 'REGISTRATIONS' | 'SUBSCRIPTIONS' | 'SALES' | 'MODERATORS' | 'ACTIVITY', filters?: ReportsFilter): Promise<string>;
}
export declare const reportsService: ReportsService;
