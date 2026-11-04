"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const subscriptions_1 = require("../shared/subscriptions");
const SubscriptionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    planId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: Object.values(subscriptions_1.SubscriptionStatus),
        default: subscriptions_1.SubscriptionStatus.PENDING,
        index: true
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true,
        index: true
    },
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    providerPaymentId: {
        type: String,
        index: true
    },
    secretCode: {
        type: String,
        index: true,
        trim: true
    },
    isSecretCodeClaimed: {
        type: Boolean,
        default: false,
        index: true
    },
    secretCodeClaimedAt: {
        type: Date
    },
    isApprovedByAdmin: {
        type: Boolean,
        default: false,
        index: true
    },
    approvedByAdminId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: {
        type: Date
    },
    isManualGrant: {
        type: Boolean,
        default: false,
        index: true
    },
    grantReason: {
        type: String
    },
    grantedByAdminId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    isRevoked: {
        type: Boolean,
        default: false,
        index: true
    },
    revokedAt: {
        type: Date
    },
    revocationReason: {
        type: String
    },
    extendedAt: {
        type: Date
    },
    extensionReason: {
        type: String
    }
}, {
    timestamps: true
});
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ userId: 1, endDate: -1 });
SubscriptionSchema.index({ status: 1, isRevoked: 1, endDate: -1, userId: 1 });
SubscriptionSchema.index({ planId: 1, status: 1 });
SubscriptionSchema.index({ createdAt: -1 });
exports.SubscriptionModel = mongoose_1.default.models.Subscription || mongoose_1.default.model('Subscription', SubscriptionSchema);
//# sourceMappingURL=Subscription.js.map