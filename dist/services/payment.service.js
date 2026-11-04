"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const Payment_1 = require("../models/Payment");
const Subscription_1 = require("../models/Subscription");
const User_1 = require("../models/User");
const FinancialLedger_1 = require("../models/FinancialLedger");
const ReferralCommission_1 = require("../models/ReferralCommission");
const CommissionPolicy_1 = require("../models/CommissionPolicy");
const subscription_service_1 = require("./subscription.service");
const nowpayments_service_1 = require("./nowpayments.service");
const notification_service_1 = require("./notification.service");
const subscriptions_1 = require("../shared/subscriptions");
const plans_1 = require("../shared/plans");
const crypto_1 = require("../utils/crypto");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const roles_1 = require("../shared/roles");
class PaymentService {
    /**
     * Create a purchase order and initialize a NOWPayments invoice
     */
    async createPurchaseOrder(userId, planId, payCurrency = 'USDTTRC20') {
        const plan = await subscription_service_1.subscriptionService.getPlanById(planId);
        if (!plan) {
            throw apiError_1.ApiError.notFound(`Plan with id ${planId} does not exist`);
        }
        if (!plan.isActive) {
            throw apiError_1.ApiError.badRequest(`Plan ${plan.name} is currently inactive and cannot be purchased`);
        }
        const orderId = `ORD_${Date.now()}_${(0, crypto_1.generateRandomString)(6).toUpperCase()}`;
        let paymentId = `NP_${Date.now()}_${(0, crypto_1.generateRandomString)(8).toUpperCase()}`;
        const frontendUrl = env_1.env.PUBLIC_FRONTEND_URL;
        let checkoutUrl = `${frontendUrl}/checkout/pending?orderId=${orderId}`;
        let payAddress;
        let payAmount;
        // Contact NOWPayments API if API key is present
        if (env_1.env.NOWPAYMENTS_API_KEY && env_1.env.NOWPAYMENTS_API_KEY.trim() !== '') {
            try {
                const ipnUrl = env_1.env.NOWPAYMENTS_IPN_CALLBACK_URL || (env_1.env.BACKEND_URL ? `${env_1.env.BACKEND_URL}/api/v1/payments/ipn` : `http://localhost:${env_1.env.PORT}/api/v1/payments/ipn`);
                const invoice = await nowpayments_service_1.nowPaymentsService.createInvoice({
                    priceAmount: plan.priceUsd,
                    priceCurrency: 'USD',
                    payCurrency: payCurrency.toLowerCase(),
                    orderId,
                    orderDescription: `Roulette.tools — ${plan.name} (${plan.durationDays} Days Access)`,
                    ipnCallbackUrl: ipnUrl,
                    successUrl: `${frontendUrl}/checkout/pending?orderId=${orderId}`,
                    cancelUrl: `${frontendUrl}/plans`
                });
                if (invoice) {
                    paymentId = String(invoice.id || invoice.payment_id || paymentId);
                    if (invoice.invoice_url) {
                        checkoutUrl = invoice.invoice_url;
                    }
                    if (invoice.pay_address) {
                        payAddress = invoice.pay_address;
                    }
                    if (invoice.pay_amount) {
                        payAmount = Number(invoice.pay_amount);
                    }
                }
            }
            catch (err) {
                logger_1.logger.error('Failed to create NOWPayments invoice, proceeding with order record', { error: err?.message });
            }
        }
        // Server-side referral attribution snapshotting (Never trust client-supplied codes)
        let referredByModeratorId;
        let referralCodeSnapshot;
        let commissionRateSnapshot;
        const userDoc = await User_1.UserModel.findById(userId);
        if (userDoc && userDoc.referredBy) {
            const moderatorDoc = await User_1.UserModel.findById(userDoc.referredBy);
            if (moderatorDoc &&
                moderatorDoc.role === roles_1.UserRole.MODERATOR &&
                moderatorDoc.accountStatus === User_1.AccountStatus.ACTIVE &&
                !moderatorDoc.isDeleted) {
                referredByModeratorId = moderatorDoc._id;
                referralCodeSnapshot = userDoc.referralCodeUsed || moderatorDoc.referralCode;
                const activePolicy = await CommissionPolicy_1.CommissionPolicyModel.getActivePolicy();
                commissionRateSnapshot = moderatorDoc.moderatorCommissionRate ?? activePolicy.defaultRate ?? 0.50;
            }
        }
        // Persist immutable purchase order snapshot
        const payment = await Payment_1.PaymentModel.create({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            planId: plan.id,
            planName: plan.name,
            priceCents: plan.priceCents,
            priceAmount: plan.priceUsd,
            priceCurrency: 'USD',
            duration: plan.duration,
            durationDays: plan.durationDays,
            payAmount,
            payCurrency: payCurrency.toUpperCase(),
            paymentId,
            orderId,
            status: subscriptions_1.PaymentStatus.WAITING,
            isFulfilled: false,
            payAddress,
            checkoutUrl,
            referredByModeratorId,
            referralCodeSnapshot,
            commissionRateSnapshot,
            ipnHistory: []
        });
        logger_1.logger.info(`Purchase order created: ${orderId} for user ${userId} (Plan: ${plan.id}, Amount: $${plan.priceUsd})`);
        return {
            orderId: payment.orderId,
            paymentId: payment.paymentId,
            planId: payment.planId,
            planName: payment.planName,
            priceUsd: payment.priceAmount,
            priceCents: payment.priceCents,
            status: payment.status,
            checkoutUrl: payment.checkoutUrl || checkoutUrl,
            payAddress: payment.payAddress,
            payAmount: payment.payAmount,
            payCurrency: payment.payCurrency,
            createdAt: payment.createdAt.toISOString()
        };
    }
    /**
     * Process and verify NOWPayments IPN webhook callbacks
     */
    async processIpnCallback(payload, signature, customSecret) {
        if (!signature || signature.trim() === '') {
            logger_1.logger.warn('IPN Callback rejected: Missing x-nowpayments-sig header');
            throw apiError_1.ApiError.unauthorized('Missing x-nowpayments-sig signature header');
        }
        // 1. Signature Verification
        const isValidSignature = nowpayments_service_1.nowPaymentsService.verifyIpnSignature(payload, signature, customSecret);
        if (!isValidSignature) {
            logger_1.logger.warn('IPN Callback rejected: Cryptographic signature mismatch', {
                orderId: payload.order_id,
                paymentId: payload.payment_id
            });
            throw apiError_1.ApiError.unauthorized('Invalid IPN signature. Request origin cannot be verified.');
        }
        // 2. Order Matching
        const orderId = payload.order_id;
        const paymentId = String(payload.payment_id);
        const payment = await Payment_1.PaymentModel.findOne({
            $or: [{ orderId }, { paymentId }]
        });
        if (!payment) {
            logger_1.logger.warn(`IPN Callback received for unknown order: ${orderId} (paymentId: ${paymentId})`);
            return {
                success: false,
                status: subscriptions_1.PaymentStatus.FAILED,
                isFulfilled: false,
                message: `Order reference ${orderId} was not found on this platform`
            };
        }
        // 3. Record Audit History
        const receivedStatus = (payload.payment_status || '').toLowerCase().trim();
        const actuallyPaid = payload.actually_paid !== undefined ? Number(payload.actually_paid) : payment.actuallyPaid;
        payment.ipnHistory.push({
            receivedAt: new Date(),
            paymentStatus: receivedStatus,
            actuallyPaid,
            rawPayload: payload
        });
        payment.rawIpnData = payload;
        payment.actuallyPaid = actuallyPaid;
        // 4. Server-Side Amount and Currency Validation
        const expectedAmount = payment.priceAmount;
        const reportedPriceAmount = Number(payload.price_amount);
        if (reportedPriceAmount && Math.abs(reportedPriceAmount - expectedAmount) > 0.05) {
            payment.status = subscriptions_1.PaymentStatus.REVIEW_REQUIRED;
            payment.failureReason = `Price amount mismatch: expected $${expectedAmount}, reported $${reportedPriceAmount}`;
            await payment.save();
            logger_1.logger.error(`IPN Security Alert: Price mismatch on order ${payment.orderId}`, {
                expected: expectedAmount,
                reported: reportedPriceAmount
            });
            return {
                success: false,
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                status: payment.status,
                isFulfilled: false,
                message: 'Security validation failed: Price amount mismatch'
            };
        }
        if (payload.price_currency && payload.price_currency.toUpperCase() !== payment.priceCurrency) {
            payment.status = subscriptions_1.PaymentStatus.REVIEW_REQUIRED;
            payment.failureReason = `Currency mismatch: expected ${payment.priceCurrency}, reported ${payload.price_currency}`;
            await payment.save();
            logger_1.logger.error(`IPN Security Alert: Currency mismatch on order ${payment.orderId}`);
            return {
                success: false,
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                status: payment.status,
                isFulfilled: false,
                message: 'Security validation failed: Price currency mismatch'
            };
        }
        // 5. Handle Terminal or Failure States
        if (receivedStatus === 'failed') {
            payment.status = subscriptions_1.PaymentStatus.FAILED;
            payment.failureReason = 'Payment failed on the blockchain';
            await payment.save();
            await notification_service_1.notificationService.createNotification(payment.userId, 'PAYMENT_FAILED', 'Payment Failed', `Payment order ${payment.orderId} failed on the blockchain.`, '/plans').catch(() => null);
            return {
                success: true,
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                status: subscriptions_1.PaymentStatus.FAILED,
                isFulfilled: false,
                message: 'Order marked as FAILED based on provider callback'
            };
        }
        if (receivedStatus === 'expired') {
            payment.status = subscriptions_1.PaymentStatus.EXPIRED;
            payment.failureReason = 'Payment window expired before full receipt';
            await payment.save();
            return {
                success: true,
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                status: subscriptions_1.PaymentStatus.EXPIRED,
                isFulfilled: false,
                message: 'Order marked as EXPIRED'
            };
        }
        if (receivedStatus === 'refunded') {
            payment.status = subscriptions_1.PaymentStatus.REFUNDED;
            payment.failureReason = 'Payment was refunded';
            await payment.save();
            // Reverse any associated moderator commission
            await ReferralCommission_1.ReferralCommissionModel.updateMany({ paymentId: payment._id, status: { $ne: 'REVERSED' } }, {
                status: 'REVERSED',
                reversalDetails: {
                    reversedAt: new Date(),
                    reason: 'Payment refunded via NOWPayments gateway IPN'
                }
            });
            return {
                success: true,
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                status: subscriptions_1.PaymentStatus.REFUNDED,
                isFulfilled: false,
                message: 'Order marked as REFUNDED'
            };
        }
        if (receivedStatus === 'partially_paid') {
            payment.status = subscriptions_1.PaymentStatus.PARTIALLY_PAID;
            payment.failureReason = `Underpayment received: actually paid ${actuallyPaid} ${payment.payCurrency}`;
            await payment.save();
            logger_1.logger.warn(`Underpayment detected for order ${payment.orderId}`);
            return {
                success: true,
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                status: subscriptions_1.PaymentStatus.PARTIALLY_PAID,
                isFulfilled: false,
                message: 'Order underpaid; held in PARTIALLY_PAID status without activation'
            };
        }
        // 6. Map In-Flight States
        if (receivedStatus === 'confirming') {
            payment.status = subscriptions_1.PaymentStatus.CONFIRMING;
            await payment.save();
            return {
                success: true,
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                status: subscriptions_1.PaymentStatus.CONFIRMING,
                isFulfilled: false,
                message: 'Payment confirming on blockchain'
            };
        }
        if (receivedStatus === 'waiting') {
            payment.status = subscriptions_1.PaymentStatus.WAITING;
            await payment.save();
            return {
                success: true,
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                status: subscriptions_1.PaymentStatus.WAITING,
                isFulfilled: false,
                message: 'Payment waiting for funds'
            };
        }
        // 7. Qualifying Payment States: 'finished' or 'confirmed'
        const isQualifyingState = receivedStatus === 'finished' || receivedStatus === 'confirmed';
        if (!isQualifyingState) {
            payment.status = subscriptions_1.PaymentStatus.WAITING;
            await payment.save();
            return {
                success: true,
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                status: payment.status,
                isFulfilled: false,
                message: `Status ${receivedStatus} recorded; awaiting final qualifying state`
            };
        }
        // 8. Idempotency Check: Prevent duplicate activations
        if (payment.isFulfilled) {
            logger_1.logger.info(`Duplicate IPN event for already fulfilled order ${payment.orderId}`);
            payment.status = subscriptions_1.PaymentStatus.FINISHED;
            await payment.save();
            return {
                success: true,
                orderId: payment.orderId,
                paymentId: payment.paymentId,
                status: subscriptions_1.PaymentStatus.FINISHED,
                isFulfilled: true,
                duplicate: true,
                subscriptionId: payment.subscriptionId?.toString(),
                message: 'Order was already fulfilled; duplicate callback processed safely without double-extension'
            };
        }
        // 9. Authoritative Subscription Activation & Renewal Rule
        const now = new Date();
        // Check if user currently has an ACTIVE subscription
        const existingActiveSub = await Subscription_1.SubscriptionModel.findOne({
            userId: payment.userId,
            status: subscriptions_1.SubscriptionStatus.ACTIVE,
            isRevoked: { $ne: true },
            endDate: { $gt: now }
        }).sort({ endDate: -1 });
        let subscriptionStartDate;
        let subscriptionEndDate;
        if (existingActiveSub) {
            // RENEWAL RULE: Extend from the existing active subscription's expiry date
            subscriptionStartDate = existingActiveSub.endDate;
            subscriptionEndDate = (0, plans_1.calculatePlanExpiration)(existingActiveSub.endDate, payment.duration);
            // Extend the existing active record so current session remains unbroken
            existingActiveSub.endDate = subscriptionEndDate;
            existingActiveSub.extendedAt = now;
            existingActiveSub.extensionReason = `Renewed via payment order ${payment.orderId}`;
            await existingActiveSub.save();
            logger_1.logger.info(`Subscription renewed for user ${payment.userId}. Extended from ${subscriptionStartDate.toISOString()} to ${subscriptionEndDate.toISOString()}`);
        }
        else {
            // First-time or lapsed activation: Starts immediately from now
            subscriptionStartDate = now;
            subscriptionEndDate = (0, plans_1.calculatePlanExpiration)(now, payment.duration);
        }
        // Record the paid subscription document
        const newSubscription = await Subscription_1.SubscriptionModel.create({
            userId: payment.userId,
            planId: payment.planId,
            status: subscriptions_1.SubscriptionStatus.ACTIVE,
            startDate: subscriptionStartDate,
            endDate: subscriptionEndDate,
            paymentId: payment._id,
            providerPaymentId: payment.paymentId,
            isManualGrant: false,
            isApprovedByAdmin: true,
            approvedAt: now,
            isSecretCodeClaimed: true,
            secretCodeClaimedAt: now
        });
        // Mark payment as fulfilled
        payment.status = subscriptions_1.PaymentStatus.FINISHED;
        payment.isFulfilled = true;
        payment.subscriptionId = newSubscription._id;
        await payment.save();
        await notification_service_1.notificationService.createNotification(payment.userId, 'SUBSCRIPTION_ACTIVATED', 'Payment Confirmed & Subscription Active', `Your payment of $${payment.priceAmount} for ${payment.planName} has been confirmed on the blockchain. Prediction feeds are live!`, '/dashboard/tool').catch(() => null);
        // 10. Record Immutable Financial Ledger Entry
        await FinancialLedger_1.FinancialLedgerModel.create({
            userId: payment.userId,
            orderId: payment.orderId,
            paymentId: payment.paymentId,
            subscriptionId: newSubscription._id,
            planId: payment.planId,
            type: 'SUBSCRIPTION_PURCHASE',
            amountCents: payment.priceCents,
            amountUsd: payment.priceAmount,
            payAmount: payment.payAmount,
            actuallyPaid,
            payCurrency: payment.payCurrency,
            status: 'SETTLED',
            notes: `Subscription payment confirmed via NOWPayments IPN (${receivedStatus})`
        });
        // 11. Moderator Referral Commission Attribution (Idempotent & Snapshot Guaranteed)
        const payingUser = await User_1.UserModel.findById(payment.userId);
        const targetModeratorId = payment.referredByModeratorId || (payingUser && payingUser.referredBy);
        if (targetModeratorId) {
            const moderatorUser = await User_1.UserModel.findById(targetModeratorId);
            if (moderatorUser &&
                moderatorUser.role === roles_1.UserRole.MODERATOR &&
                moderatorUser.accountStatus === User_1.AccountStatus.ACTIVE &&
                !moderatorUser.isDeleted) {
                // Safe check for duplicate webhooks
                const existingCommission = await ReferralCommission_1.ReferralCommissionModel.findOne({ paymentId: payment._id });
                if (!existingCommission) {
                    const activePolicy = await CommissionPolicy_1.CommissionPolicyModel.getActivePolicy();
                    const rate = payment.commissionRateSnapshot ?? moderatorUser.moderatorCommissionRate ?? activePolicy.defaultRate ?? 0.50;
                    const commissionableAmount = payment.priceAmount;
                    const commissionAmountUsd = Math.round((commissionableAmount * rate) * 100) / 100;
                    await ReferralCommission_1.ReferralCommissionModel.create({
                        moderatorId: moderatorUser._id,
                        referredUserId: payingUser._id,
                        subscriptionId: newSubscription._id,
                        paymentId: payment._id,
                        purchaseId: payment.orderId,
                        subscriptionPlan: payment.planId,
                        originalPurchaseAmount: payment.priceAmount,
                        commissionableAmount,
                        commissionRate: rate,
                        amountUsd: commissionAmountUsd,
                        status: 'CREDITED'
                    });
                    logger_1.logger.info(`Moderator ${moderatorUser._id} credited $${commissionAmountUsd} (${rate * 100}%) commission for order ${payment.orderId}`);
                }
            }
        }
        logger_1.logger.info(`Order ${payment.orderId} fulfilled successfully. Subscription ${newSubscription._id} active through ${subscriptionEndDate.toISOString()}`);
        return {
            success: true,
            orderId: payment.orderId,
            paymentId: payment.paymentId,
            status: subscriptions_1.PaymentStatus.FINISHED,
            isFulfilled: true,
            subscriptionId: newSubscription._id.toString(),
            message: 'Subscription successfully activated'
        };
    }
    /**
     * Get single order by orderId
     */
    async getOrder(orderId, userId, isSuperAdmin) {
        const payment = await Payment_1.PaymentModel.findOne({ orderId });
        if (!payment) {
            throw apiError_1.ApiError.notFound(`Order ${orderId} was not found`);
        }
        if (payment.userId.toString() !== userId && !isSuperAdmin) {
            throw apiError_1.ApiError.forbidden('You are not authorized to view this purchase order');
        }
        return payment;
    }
    /**
     * Admin Payment Management: View, search, and filter orders
     */
    async getAdminOrders(filter) {
        const page = Math.max(1, filter.page || 1);
        const limit = Math.min(100, Math.max(1, filter.limit || 20));
        const skip = (page - 1) * limit;
        const query = {};
        if (filter.status && filter.status !== 'ALL') {
            query.status = filter.status;
        }
        if (filter.planId && filter.planId !== 'ALL') {
            query.planId = filter.planId;
        }
        if (filter.startDate || filter.endDate) {
            query.createdAt = {};
            if (filter.startDate)
                query.createdAt.$gte = new Date(filter.startDate);
            if (filter.endDate)
                query.createdAt.$lte = new Date(filter.endDate);
        }
        if (filter.search && filter.search.trim() !== '') {
            const searchRegex = new RegExp(filter.search.trim(), 'i');
            const matchingUsers = await User_1.UserModel.find({
                $or: [{ email: searchRegex }, { name: searchRegex }, { phone: searchRegex }]
            }).select('_id');
            const userIds = matchingUsers.map(u => u._id);
            query.$or = [
                { orderId: searchRegex },
                { paymentId: searchRegex },
                { planName: searchRegex },
                { payAddress: searchRegex },
                { userId: { $in: userIds } }
            ];
        }
        const [orders, total] = await Promise.all([
            Payment_1.PaymentModel.find(query)
                .populate('userId', 'name email phone role')
                .populate('subscriptionId', 'status startDate endDate')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Payment_1.PaymentModel.countDocuments(query)
        ]);
        const normalizedOrders = orders.map((o) => ({
            ...o,
            paymentStatus: o.status,
            priceAmountUsd: o.priceAmount,
            payAmountCrypto: o.payAmount
        }));
        return {
            orders: normalizedOrders,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit))
        };
    }
    /**
     * Admin Payment Management: High-level financial summary
     */
    async getAdminSummary() {
        const [totalOrders, completedOrders, pendingOrders, failedOrders, reviewRequiredOrders, grossAgg] = await Promise.all([
            Payment_1.PaymentModel.countDocuments(),
            Payment_1.PaymentModel.countDocuments({ status: subscriptions_1.PaymentStatus.FINISHED }),
            Payment_1.PaymentModel.countDocuments({ status: { $in: [subscriptions_1.PaymentStatus.WAITING, subscriptions_1.PaymentStatus.CONFIRMING, subscriptions_1.PaymentStatus.SENDING] } }),
            Payment_1.PaymentModel.countDocuments({ status: { $in: [subscriptions_1.PaymentStatus.FAILED, subscriptions_1.PaymentStatus.EXPIRED] } }),
            Payment_1.PaymentModel.countDocuments({ status: { $in: [subscriptions_1.PaymentStatus.PARTIALLY_PAID, subscriptions_1.PaymentStatus.REVIEW_REQUIRED] } }),
            Payment_1.PaymentModel.aggregate([
                { $match: { isFulfilled: true } },
                { $group: { _id: null, totalUsd: { $sum: '$priceAmount' } } }
            ])
        ]);
        const totalGrossUsd = grossAgg.length > 0 ? grossAgg[0].totalUsd : 0;
        const paymentFeesUsd = Math.round(totalGrossUsd * 0.01 * 100) / 100;
        const commAgg = await Payment_1.PaymentModel.aggregate([
            { $match: { isFulfilled: true, referredByModeratorId: { $exists: true, $ne: null } } },
            { $group: { _id: null, totalUsd: { $sum: '$priceAmount' } } }
        ]);
        const eligibleReferredUsd = commAgg.length > 0 ? commAgg[0].totalUsd : 0;
        const commissionLiabilitiesUsd = Math.round(eligibleReferredUsd * 0.5 * 100) / 100;
        const netRevenueUsd = Math.max(0, Math.round((totalGrossUsd - paymentFeesUsd - commissionLiabilitiesUsd) * 100) / 100);
        return {
            totalGrossUsd,
            totalOrders,
            completedOrders,
            pendingOrders,
            failedOrders,
            reviewRequiredOrders,
            grossSalesUsd: totalGrossUsd,
            confirmedCount: completedOrders,
            pendingCount: pendingOrders,
            failedCount: failedOrders,
            paymentFeesUsd,
            outstandingCommissionLiabilitiesUsd: commissionLiabilitiesUsd,
            netRevenueUsd
        };
    }
    /**
     * Admin Payment Management: Export reconciliation report (JSON + CSV structure)
     */
    async exportAdminReport(startDate, endDate) {
        const query = {};
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate)
                query.createdAt.$gte = new Date(startDate);
            if (endDate)
                query.createdAt.$lte = new Date(endDate);
        }
        const orders = await Payment_1.PaymentModel.find(query)
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        const headers = [
            'Order ID',
            'Payment ID',
            'Customer Email',
            'Customer Name',
            'Plan ID',
            'Plan Name',
            'Price USD',
            'Pay Currency',
            'Actually Paid',
            'Status',
            'Is Fulfilled',
            'Subscription ID',
            'Failure Reason',
            'Created At'
        ];
        let totalGrossUsd = 0;
        const rows = orders.map((o) => {
            if (o.isFulfilled) {
                totalGrossUsd += o.priceAmount;
            }
            return [
                o.orderId,
                o.paymentId,
                o.userId?.email || 'N/A',
                `"${(o.userId?.name || '').replace(/"/g, '""')}"`,
                o.planId,
                `"${o.planName.replace(/"/g, '""')}"`,
                o.priceAmount,
                o.payCurrency,
                o.actuallyPaid !== undefined ? o.actuallyPaid : '',
                o.status,
                o.isFulfilled ? 'YES' : 'NO',
                o.subscriptionId?.toString() || '',
                `"${(o.failureReason || '').replace(/"/g, '""')}"`,
                o.createdAt.toISOString()
            ].join(',');
        });
        const csv = [headers.join(','), ...rows].join('\n');
        return {
            csv,
            count: orders.length,
            totalGrossUsd
        };
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
//# sourceMappingURL=payment.service.js.map