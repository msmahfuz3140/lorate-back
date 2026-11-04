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
exports.PaymentModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const subscriptions_1 = require("../shared/subscriptions");
const PaymentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    planId: {
        type: String,
        required: true,
        index: true
    },
    planName: {
        type: String,
        required: true
    },
    priceCents: {
        type: Number,
        required: true
    },
    priceAmount: {
        type: Number,
        required: true
    },
    priceCurrency: {
        type: String,
        default: 'USD'
    },
    duration: {
        unit: {
            type: String,
            enum: ['DAYS', 'MONTHS'],
            required: true
        },
        value: {
            type: Number,
            required: true
        }
    },
    durationDays: {
        type: Number,
        required: true
    },
    payAmount: {
        type: Number
    },
    actuallyPaid: {
        type: Number
    },
    payCurrency: {
        type: String,
        default: 'USDTTRC20'
    },
    paymentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    orderId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    status: {
        type: String,
        enum: Object.values(subscriptions_1.PaymentStatus),
        default: subscriptions_1.PaymentStatus.WAITING,
        index: true
    },
    isFulfilled: {
        type: Boolean,
        default: false,
        index: true
    },
    subscriptionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Subscription',
        index: true
    },
    failureReason: {
        type: String
    },
    payAddress: {
        type: String
    },
    checkoutUrl: {
        type: String
    },
    referredByModeratorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    referralCodeSnapshot: {
        type: String
    },
    commissionRateSnapshot: {
        type: Number
    },
    rawIpnData: {
        type: mongoose_1.Schema.Types.Mixed
    },
    ipnHistory: [{
            receivedAt: {
                type: Date,
                default: Date.now
            },
            paymentStatus: {
                type: String,
                required: true
            },
            actuallyPaid: {
                type: Number
            },
            rawPayload: {
                type: mongoose_1.Schema.Types.Mixed
            }
        }]
}, {
    timestamps: true
});
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ userId: 1, isFulfilled: 1, priceAmount: 1 });
PaymentSchema.index({ status: 1, isFulfilled: 1 });
PaymentSchema.index({ isFulfilled: 1, createdAt: -1 });
PaymentSchema.index({ referredByModeratorId: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });
exports.PaymentModel = mongoose_1.default.models.Payment || mongoose_1.default.model('Payment', PaymentSchema);
//# sourceMappingURL=Payment.js.map