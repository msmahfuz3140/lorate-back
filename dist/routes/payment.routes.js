"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRoutes = void 0;
const express_1 = require("express");
const payment_controller_1 = require("../controllers/payment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const roles_1 = require("../shared/roles");
const router = (0, express_1.Router)();
// Public: Supported cryptocurrencies list
router.get('/currencies', (req, res, next) => payment_controller_1.paymentController.getCurrencies(req, res, next));
// Public webhook: NOWPayments IPN callback (validates x-nowpayments-sig)
router.post('/ipn', (req, res, next) => payment_controller_1.paymentController.handleIpn(req, res, next));
// Authenticated: Create purchase order (rate limited to 10 per 15 minutes)
router.post('/create-order', auth_middleware_1.requireAuth, (0, rateLimit_middleware_1.rateLimit)(10, 15, 'order_create'), (req, res, next) => payment_controller_1.paymentController.createOrder(req, res, next));
// Authenticated: Get order details by orderId
router.get('/order/:orderId', auth_middleware_1.requireAuth, (req, res, next) => payment_controller_1.paymentController.getOrder(req, res, next));
// --- Admin Controls (Main Admins only) ---
router.get('/admin/orders', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => payment_controller_1.paymentController.getAdminOrders(req, res, next));
router.get('/admin/summary', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => payment_controller_1.paymentController.getAdminSummary(req, res, next));
router.get('/admin/export', auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(roles_1.UserRole.SUPER_ADMIN), (req, res, next) => payment_controller_1.paymentController.exportAdminReport(req, res, next));
exports.paymentRoutes = router;
//# sourceMappingURL=payment.routes.js.map