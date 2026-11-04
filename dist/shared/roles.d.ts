export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    MODERATOR = "MODERATOR",
    USER = "USER"
}
export declare const USER_ROLES: readonly [UserRole.SUPER_ADMIN, UserRole.MODERATOR, UserRole.USER];
export interface RolePermissions {
    canAccessPredictionTool: boolean;
    canManageUsers: boolean;
    canManageModerators: boolean;
    canViewReports: boolean;
    canEarnReferralCommission: boolean;
    canManagePlans: boolean;
    canAccessAdminPanel: boolean;
}
export declare const ROLE_PERMISSIONS: Record<string, RolePermissions>;
