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
exports.CommissionPolicyModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const CommissionPolicySchema = new mongoose_1.Schema({
    defaultRate: {
        type: Number,
        required: true,
        default: 0.50,
        min: 0.0,
        max: 1.0
    },
    commissionableBasis: {
        type: String,
        required: true,
        default: 'GROSS_CONFIRMED_SUBSCRIPTION_SALES_USD'
    },
    description: {
        type: String,
        required: true,
        default: 'Commission base is exactly 50% of qualifying paid subscription purchases confirmed on-chain. Commissionable revenue excludes failed payments, unconfirmed transactions, refunded/reversed sales, and complimentary manual grants.'
    },
    updatedByAdminId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedByAdminEmail: {
        type: String
    },
    auditReason: {
        type: String
    },
    effectiveFrom: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
CommissionPolicySchema.statics.getActivePolicy = async function () {
    let policy = await this.findOne().sort({ createdAt: -1 });
    if (!policy) {
        policy = await this.create({
            defaultRate: 0.50,
            commissionableBasis: 'GROSS_CONFIRMED_SUBSCRIPTION_SALES_USD',
            description: 'Commission base is exactly 50% of qualifying paid subscription purchases confirmed on-chain. Commissionable revenue excludes failed payments, unconfirmed transactions, refunded/reversed sales, and complimentary manual grants.',
            effectiveFrom: new Date(),
            auditReason: 'System initialization baseline'
        });
    }
    return policy;
};
exports.CommissionPolicyModel = mongoose_1.default.models.CommissionPolicy ||
    mongoose_1.default.model('CommissionPolicy', CommissionPolicySchema);
//# sourceMappingURL=CommissionPolicy.js.map