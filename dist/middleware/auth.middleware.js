"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
exports.requirePremiumSubscription = requirePremiumSubscription;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const apiError_1 = require("../utils/apiError");
const roles_1 = require("../shared/roles");
const user_repository_1 = require("../repositories/user.repository");
const subscription_repository_1 = require("../repositories/subscription.repository");
async function requireAuth(req, res, next) {
    let token;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    else if (req.query && typeof req.query.token === 'string' && req.query.token.trim() !== '') {
        token = req.query.token.trim();
    }
    else if (req.headers.cookie) {
        const match = req.headers.cookie.match(/(?:^|;\s*)(?:sloot_token|token)=([^;]+)/);
        if (match) {
            token = decodeURIComponent(match[1]);
        }
    }
    if (!token) {
        next(apiError_1.ApiError.unauthorized('Authentication token is required'));
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await user_repository_1.userRepository.findById(decoded.userId);
        if (!user) {
            next(apiError_1.ApiError.unauthorized('User not found'));
            return;
        }
        if (user.sessionsRevokedAt && decoded.iat && (decoded.iat * 1000) < user.sessionsRevokedAt.getTime()) {
            next(apiError_1.ApiError.unauthorized('Session has been revoked by administration. Please log in again.'));
            return;
        }
        const activeSub = await subscription_repository_1.subscriptionRepository.findActiveByUserId(user._id);
        req.user = {
            id: user._id.toString(),
            name: user.name || 'Member',
            email: user.email,
            phone: user.phone,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified,
            isActive: user.isActive,
            referralCode: user.referralCode,
            hasActiveSubscription: !!activeSub || user.role === roles_1.UserRole.SUPER_ADMIN || user.role === roles_1.UserRole.MODERATOR,
            subscriptionPlanId: activeSub?.planId,
            subscriptionExpiresAt: activeSub?.endDate?.toISOString(),
            createdAt: user.createdAt.toISOString()
        };
        next();
    }
    catch {
        next(apiError_1.ApiError.unauthorized('Invalid or expired authentication token'));
    }
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            next(apiError_1.ApiError.unauthorized());
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            next(apiError_1.ApiError.forbidden('You do not have permission to access this resource'));
            return;
        }
        next();
    };
}
function requirePremiumSubscription(req, res, next) {
    if (!req.user) {
        next(apiError_1.ApiError.unauthorized());
        return;
    }
    // Main Admins and Moderators have full access by role
    if (req.user.role === roles_1.UserRole.SUPER_ADMIN || req.user.role === roles_1.UserRole.MODERATOR) {
        next();
        return;
    }
    if (!req.user.hasActiveSubscription) {
        next(apiError_1.ApiError.forbidden('Active premium subscription required to access the prediction engine', 'SUBSCRIPTION_REQUIRED'));
        return;
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map