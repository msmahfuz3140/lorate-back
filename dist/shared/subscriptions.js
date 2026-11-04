"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevokeSubscriptionSchema = exports.ExtendSubscriptionSchema = exports.GrantManualSubscriptionSchema = exports.UnlockToolSchema = exports.CreatePaymentSchema = exports.PaymentStatus = exports.SubscriptionStatus = void 0;
const zod_1 = require("zod");
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["PENDING"] = "PENDING";
    SubscriptionStatus["REVOKED"] = "REVOKED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["WAITING"] = "WAITING";
    PaymentStatus["CONFIRMING"] = "CONFIRMING";
    PaymentStatus["CONFIRMED"] = "CONFIRMED";
    PaymentStatus["SENDING"] = "SENDING";
    PaymentStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    PaymentStatus["FINISHED"] = "FINISHED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["EXPIRED"] = "EXPIRED";
    PaymentStatus["REVIEW_REQUIRED"] = "REVIEW_REQUIRED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
exports.CreatePaymentSchema = zod_1.z.object({
    planId: zod_1.z.string().min(1, 'Subscription plan ID is required'),
    payCurrency: zod_1.z.string().default('USDTTRC20')
});
exports.UnlockToolSchema = zod_1.z.object({
    secretCode: zod_1.z.string().min(3, 'Valid secret code is required')
});
exports.GrantManualSubscriptionSchema = zod_1.z.object({
    targetEmail: zod_1.z.string().email('Valid user email is required'),
    planId: zod_1.z.string().min(1, 'Plan ID is required'),
    reason: zod_1.z.string().min(3, 'Detailed reason for manual grant is required')
});
exports.ExtendSubscriptionSchema = zod_1.z.object({
    subscriptionId: zod_1.z.string().min(1, 'Subscription ID is required'),
    extensionValue: zod_1.z.number().int().min(1, 'Extension duration value must be positive integer'),
    extensionUnit: zod_1.z.enum(['DAYS', 'MONTHS']),
    reason: zod_1.z.string().min(3, 'Reason for extension is required')
});
exports.RevokeSubscriptionSchema = zod_1.z.object({
    subscriptionId: zod_1.z.string().min(1, 'Subscription ID is required'),
    reason: zod_1.z.string().min(3, 'Reason for revocation is required')
});
//# sourceMappingURL=subscriptions.js.map