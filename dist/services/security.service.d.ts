export declare class SecurityService {
    /**
     * Aggregate platform security overview telemetry
     */
    getSecurityOverview(): Promise<any>;
    /**
     * Fetch active security alerts
     */
    getSecurityAlerts(): Promise<any[]>;
    /**
     * Revoke active sessions for a user (forces re-login immediately)
     */
    revokeUserSessions(adminId: string, adminEmail: string, targetUserId: string, reason: string): Promise<{
        success: boolean;
        revokedAt: Date;
    }>;
}
export declare const securityService: SecurityService;
