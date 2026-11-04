"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveSubscription = requireActiveSubscription;
const subscriptionAccess_service_1 = require("../services/subscriptionAccess.service");
const apiError_1 = require("../utils/apiError");
/**
 * Express middleware enforcing server-side subscription validation.
 * Checks authentication, database validity, start date, end date, and revocation status.
 */
async function requireActiveSubscription(req, res, next) {
    if (!req.user) {
        next(apiError_1.ApiError.unauthorized('Authentication token is required to access the prediction engine'));
        return;
    }
    try {
        const access = await subscriptionAccess_service_1.subscriptionAccessService.checkAccess(req.user.id);
        if (!access.hasAccess) {
            next(new apiError_1.ApiError(403, access.reason || 'Active premium subscription required', access.code || 'SUBSCRIPTION_REQUIRED'));
            return;
        }
        req.accessStatus = access;
        next();
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=subscriptionAccess.middleware.js.map