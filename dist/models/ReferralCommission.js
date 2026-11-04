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
exports.ReferralCommissionModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ReferralCommissionSchema = new mongoose_1.Schema({
    moderatorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    referredUserId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    subscriptionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Subscription',
        required: false,
        index: true
    },
    paymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true,
        index: true
    },
    purchaseId: {
        type: String,
        index: true
    },
    subscriptionPlan: {
        type: String,
        index: true
    },
    originalPurchaseAmount: {
        type: Number
    },
    commissionableAmount: {
        type: Number
    },
    amountUsd: {
        type: Number,
        required: true
    },
    commissionRate: {
        type: Number,
        required: true,
        default: 0.50
    },
    status: {
        type: String,
        enum: ['PENDING', 'ELIGIBLE', 'APPROVED', 'CREDITED', 'REVERSED'],
        default: 'CREDITED',
        index: true
    },
    reversalDetails: {
        reversedAt: { type: Date },
        reversedByAdminId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
        reversedByAdminEmail: { type: String },
        reason: { type: String }
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});
ReferralCommissionSchema.index({ moderatorId: 1, createdAt: -1 });
ReferralCommissionSchema.index({ moderatorId: 1, status: 1 });
ReferralCommissionSchema.index({ status: 1, createdAt: -1 });
exports.ReferralCommissionModel = mongoose_1.default.models.ReferralCommission ||
    mongoose_1.default.model('ReferralCommission', ReferralCommissionSchema);
//# sourceMappingURL=ReferralCommission.js.map