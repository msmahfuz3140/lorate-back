"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRoutes = void 0;
const express_1 = require("express");
const subscription_controller_1 = require("../controllers/subscription.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const roles_1 = require("../shared/roles");
const router = (0, express_1.Router)();
// Public plans
router.get('/plans', (req, res, next) => subscription_controller_1.subscriptionController.getPlans(req, res, next));
// Authenticated user subscription & real-time access status
router.get('/my-subscription', auth_middleware_1.requireAuth, (req, res, next) => subscription_controller_1.subscriptionController.getMySubscription(req, res, next));
router.get('/access-status', auth_middleware_1.requireAuth, (req, res, next) => subscription_controller_1.subscriptionController.getAccessStatus(req, res, next));
// Secret Code Tool Unlock
router.post('/unlock-tool', auth_middleware_1.requireAuth, (req, res, next) => subscription_controller_1.subscriptionController.unlockTool(req, res, next));
// Main Admin: view all plans including hidden / inactive
router.get('/plans/all', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => subscription_controller_1.subscriptionController.getAllPlans(req, res, next));
// Main Admin: create new plan
router.post('/plans', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => subscription_controller_1.subscriptionController.createPlan(req, res, next));
// Main Admin: update plan price, features, description, status
router.patch('/plans/:planId', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => subscription_controller_1.subscriptionController.updatePlan(req, res, next));
// Main Admin: delete or archive plan
router.delete('/plans/:planId', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => subscription_controller_1.subscriptionController.deletePlan(req, res, next));
// Main Admin Controls: Manual grant, extend, revoke, list, approve, manual unlock
router.post('/admin/grant', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => subscription_controller_1.subscriptionController.grantManual(req, res, next));
router.post('/admin/extend', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => subscription_controller_1.subscriptionController.extend(req, res, next));
router.post('/admin/revoke', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => subscription_controller_1.subscriptionController.revoke(req, res, next));
router.get('/admin/list', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => subscription_controller_1.subscriptionController.listAllSubscriptions(req, res, next));
router.post('/admin/:subscriptionId/approve', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => subscription_controller_1.subscriptionController.approveSubscription(req, res, next));
router.post('/admin/:subscriptionId/manual-unlock', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => subscription_controller_1.subscriptionController.manuallyUnlockSubscription(req, res, next));
exports.subscriptionRoutes = router;
//# sourceMappingURL=subscription.routes.js.map