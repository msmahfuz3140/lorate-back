"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = exports.USER_ROLES = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
    UserRole["MODERATOR"] = "MODERATOR";
    UserRole["USER"] = "USER";
})(UserRole || (exports.UserRole = UserRole = {}));
exports.USER_ROLES = [
    UserRole.SUPER_ADMIN,
    UserRole.MODERATOR,
    UserRole.USER
];
exports.ROLE_PERMISSIONS = {
    [UserRole.SUPER_ADMIN]: {
        canAccessPredictionTool: true,
        canManageUsers: true,
        canManageModerators: true,
        canViewReports: true,
        canEarnReferralCommission: false,
        canManagePlans: true,
        canAccessAdminPanel: true
    },
    [UserRole.MODERATOR]: {
        canAccessPredictionTool: true,
        canManageUsers: false,
        canManageModerators: false,
        canViewReports: false,
        canEarnReferralCommission: true,
        canManagePlans: false,
        canAccessAdminPanel: false
    },
    [UserRole.USER]: {
        canAccessPredictionTool: false, // Requires active subscription
        canManageUsers: false,
        canManageModerators: false,
        canViewReports: false,
        canEarnReferralCommission: false,
        canManagePlans: false,
        canAccessAdminPanel: false
    }
};
//# sourceMappingURL=roles.js.map