"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = exports.PaymentController = void 0;
const payment_service_1 = require("../services/payment.service");
const nowpayments_service_1 = require("../services/nowpayments.service");
const roles_1 = require("../shared/roles");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
class PaymentController {
    /**
     * Create a new purchase order
     */
    async createOrder(req, res, next) {
        try {
            const { planId, payCurrency } = req.body;
            if (!planId) {
                throw apiError_1.ApiError.badRequest('planId is required to create a purchase order');
            }
            const result = await payment_service_1.paymentService.createPurchaseOrder(req.user.id, planId, payCurrency);
            res.status(201).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get single order status for the checkout screen
     */
    async getOrder(req, res, next) {
        try {
            const { orderId } = req.params;
            const isSuperAdmin = req.user.role === roles_1.UserRole.SUPER_ADMIN;
            const order = await payment_service_1.paymentService.getOrder(orderId, req.user.id, isSuperAdmin);
            res.status(200).json({
                success: true,
                data: {
                    orderId: order.orderId,
                    paymentId: order.paymentId,
                    planId: order.planId,
                    planName: order.planName,
                    priceUsd: order.priceAmount,
                    priceCents: order.priceCents,
                    duration: order.duration,
                    durationDays: order.durationDays,
                    status: order.status,
                    isFulfilled: order.isFulfilled,
                    actuallyPaid: order.actuallyPaid,
                    payCurrency: order.payCurrency,
                    checkoutUrl: order.checkoutUrl,
                    createdAt: order.createdAt
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * NOWPayments IPN Webhook Receiver
     * Processes server-to-server callback notifications
     */
    async handleIpn(req, res, next) {
        try {
            const signature = req.headers['x-nowpayments-sig'];
            const payload = req.body;
            logger_1.logger.info('NOWPayments IPN callback received', {
                orderId: payload?.order_id,
                paymentId: payload?.payment_id,
                status: payload?.payment_status
            });
            const result = await payment_service_1.paymentService.processIpnCallback(payload, signature);
            // Always respond with 200 OK so NOWPayments acknowledges receipt
            res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Get supported crypto currencies
     */
    async getCurrencies(req, res, next) {
        try {
            const currencies = await nowpayments_service_1.nowPaymentsService.getCurrencies();
            res.status(200).json({
                success: true,
                data: currencies
            });
        }
        catch (error) {
            next(error);
        }
    }
    // --- Admin Payment Controls (Main Admins only) ---
    async getAdminOrders(req, res, next) {
        try {
            const { search, status, planId, startDate, endDate, page, limit } = req.query;
            const result = await payment_service_1.paymentService.getAdminOrders({
                search: search,
                status: status,
                planId: planId,
                startDate: startDate,
                endDate: endDate,
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
    async getAdminSummary(req, res, next) {
        try {
            const summary = await payment_service_1.paymentService.getAdminSummary();
            res.status(200).json({
                success: true,
                data: summary
            });
        }
        catch (error) {
            next(error);
        }
    }
    async exportAdminReport(req, res, next) {
        try {
            const { startDate, endDate, format } = req.query;
            const report = await payment_service_1.paymentService.exportAdminReport(startDate, endDate);
            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="payments-report-${Date.now()}.csv"`);
                res.status(200).send(report.csv);
                return;
            }
            res.status(200).json({
                success: true,
                data: report
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PaymentController = PaymentController;
exports.paymentController = new PaymentController();
//# sourceMappingURL=payment.controller.js.map