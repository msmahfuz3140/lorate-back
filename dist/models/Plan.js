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
exports.PlanModel = void 0;
exports.seedPlansIfEmpty = seedPlansIfEmpty;
const mongoose_1 = __importStar(require("mongoose"));
const plans_1 = require("../shared/plans");
const PlanSchema = new mongoose_1.Schema({
    planId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    badge: {
        type: String
    },
    description: {
        type: String,
        required: true
    },
    priceCents: {
        type: Number,
        required: true,
        min: 100 // At least $1.00
    },
    duration: {
        unit: {
            type: String,
            enum: ['DAYS', 'MONTHS'],
            required: true
        },
        value: {
            type: Number,
            required: true,
            min: 1
        }
    },
    durationDays: {
        type: Number,
        required: true
    },
    features: {
        type: [String],
        default: []
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    isVisible: {
        type: Boolean,
        default: true,
        index: true
    },
    displayOrder: {
        type: Number,
        default: 0,
        index: true
    }
}, {
    timestamps: true
});
PlanSchema.index({ isVisible: 1, isActive: 1, displayOrder: 1 });
exports.PlanModel = mongoose_1.default.models.Plan || mongoose_1.default.model('Plan', PlanSchema);
let plansSeeded = false;
/**
 * Ensures initial 5 authoritative plans exist in the database.
 * Only executes query once per process lifetime.
 */
async function seedPlansIfEmpty() {
    if (plansSeeded)
        return;
    const count = await exports.PlanModel.countDocuments();
    if (count === 0) {
        let order = 0;
        for (const plan of plans_1.PLANS_ARRAY) {
            await exports.PlanModel.create({
                planId: plan.id,
                name: plan.name,
                badge: plan.badge,
                description: plan.description,
                priceCents: plan.priceCents,
                duration: plan.duration,
                durationDays: plan.durationDays,
                features: plan.features,
                isPopular: !!plan.isPopular,
                isActive: plan.isActive,
                isVisible: plan.isVisible,
                displayOrder: order++
            });
        }
    }
    plansSeeded = true;
}
//# sourceMappingURL=Plan.js.map