"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionController = exports.SubscriptionController = void 0;
const subscription_service_1 = require("../services/subscription.service");
const subscriptionAccess_service_1 = require("../services/subscriptionAccess.service");
const subscriptions_1 = require("../shared/subscriptions");
class SubscriptionController {
    async listAllSubscriptions(req, res, next) {
        try {
            const { status, planId, page, limit, search } = req.query;
            const result = await subscriptionAccess_service_1.subscriptionAccessService.listAllSubscriptions({
                status: status,
                planId: planId,
                search: search,
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 20
            });
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getPlans(req, res, next) {
        try {
            const plans = await subscription_service_1.subscriptionService.getPublicPlans();
            res.status(200).json({
                success: true,
                data: plans
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllPlans(req, res, next) {
        try {
            const plans = await subscription_service_1.subscriptionService.getAllPlans();
            res.status(200).json({
                success: true,
                data: plans
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createPlan(req, res, next) {
        try {
            const created = await subscription_service_1.subscriptionService.createPlan(req.body, req.user?.id);
            res.status(201).json({
                success: true,
                data: created
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updatePlan(req, res, next) {
        try {
            const { planId } = req.params;
            const updated = await subscription_service_1.subscriptionService.updatePlan(planId, req.body, req.user?.id);
            res.status(200).json({
                success: true,
                data: updated
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deletePlan(req, res, next) {
        try {
            const { planId } = req.params;
            const result = await subscription_service_1.subscriptionService.deletePlan(planId, req.user?.id);
            res.status(200).json(result);
        }
        catch (error) {
            next(error);
        }
    }
    async getMySubscription(req, res, next) {
        try {
            const active = await subscription_service_1.subscriptionService.getUserActiveSubscription(req.user.id);
            const history = await subscription_service_1.subscriptionService.getUserSubscriptions(req.user.id);
            res.status(200).json({
                success: true,
                data: {
                    active,
                    history
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Real-time server-side subscription validation check
     */
    async getAccessStatus(req, res, next) {
        try {
            const status = await subscriptionAccess_service_1.subscriptionAccessService.checkAccess(req.user.id);
            res.status(200).json({
                success: true,
                data: status
            });
        }
        catch (error) {
            next(error);
        }
    }
    // --- Admin Controls ---
    async grantManual(req, res, next) {
        try {
            const validated = subscriptions_1.GrantManualSubscriptionSchema.parse(req.body);
            const result = await subscriptionAccess_service_1.subscriptionAccessService.grantManualSubscription(req.user.id, validated);
            res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async extend(req, res, next) {
        try {
            const validated = subscriptions_1.ExtendSubscriptionSchema.parse(req.body);
            const result = await subscriptionAccess_service_1.subscriptionAccessService.extendSubscription(req.user.id, validated);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async revoke(req, res, next) {
        try {
            const validated = subscriptions_1.RevokeSubscriptionSchema.parse(req.body);
            const result = await subscriptionAccess_service_1.subscriptionAccessService.revokeSubscription(req.user.id, validated);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async unlockTool(req, res, next) {
        try {
            const validated = subscriptions_1.UnlockToolSchema.parse(req.body);
            const result = await subscriptionAccess_service_1.subscriptionAccessService.unlockToolWithSecretCode(req.user.id, validated.secretCode);
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async approveSubscription(req, res, next) {
        try {
            const { subscriptionId } = req.params;
            const result = await subscriptionAccess_service_1.subscriptionAccessService.approveSubscriptionAndSendSecretCode(req.user.id, req.user?.email || 'admin@roulette.tools', subscriptionId);
            res.status(200).json({
                success: true,
                message: 'Subscription approved and secret code dispatched to customer email',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    async manuallyUnlockSubscription(req, res, next) {
        try {
            const { subscriptionId } = req.params;
            const result = await subscriptionAccess_service_1.subscriptionAccessService.manuallyUnlockToolForSubscription(req.user.id, req.user?.email || 'admin@roulette.tools', subscriptionId);
            res.status(200).json({
                success: true,
                message: 'Tool access manually unlocked for this subscription',
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SubscriptionController = SubscriptionController;
exports.subscriptionController = new SubscriptionController();
//# sourceMappingURL=subscription.controller.js.map