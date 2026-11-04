"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = exports.SubscriptionService = void 0;
const plans_1 = require("../shared/plans");
const subscription_repository_1 = require("../repositories/subscription.repository");
const Plan_1 = require("../models/Plan");
const Subscription_1 = require("../models/Subscription");
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
const apiError_1 = require("../utils/apiError");
const mongoose_1 = __importDefault(require("mongoose"));
class SubscriptionService {
    publicPlansCache = null;
    allPlansCache = null;
    CACHE_TTL_MS = 30000; // 30 seconds TTL, invalidated immediately on mutation
    clearPlanCache() {
        this.publicPlansCache = null;
        this.allPlansCache = null;
    }
    mapDocToPlan(doc) {
        return {
            id: doc.planId,
            name: doc.name,
            badge: doc.badge,
            description: doc.description,
            priceUsd: Math.round(doc.priceCents / 100),
            priceCents: doc.priceCents,
            duration: doc.duration,
            durationDays: doc.durationDays,
            features: doc.features || [],
            isPopular: !!doc.isPopular,
            isActive: doc.isActive,
            isVisible: doc.isVisible,
            displayOrder: doc.displayOrder ?? 0
        };
    }
    async getPublicPlans() {
        const now = Date.now();
        if (this.publicPlansCache && this.publicPlansCache.expiry > now) {
            return this.publicPlansCache.data;
        }
        if (mongoose_1.default.connection.readyState !== 1) {
            return plans_1.PLANS_ARRAY.filter(p => p.isActive && p.isVisible);
        }
        await (0, Plan_1.seedPlansIfEmpty)();
        const docs = await Plan_1.PlanModel.find({ isActive: true, isVisible: true })
            .sort({ displayOrder: 1, priceCents: 1 })
            .lean();
        if (docs.length === 0) {
            return plans_1.PLANS_ARRAY.filter(p => p.isActive && p.isVisible);
        }
        const plans = docs.map(d => this.mapDocToPlan(d));
        this.publicPlansCache = { data: plans, expiry: now + this.CACHE_TTL_MS };
        return plans;
    }
    async getAllPlans() {
        const now = Date.now();
        if (this.allPlansCache && this.allPlansCache.expiry > now) {
            return this.allPlansCache.data;
        }
        if (mongoose_1.default.connection.readyState !== 1) {
            return plans_1.PLANS_ARRAY;
        }
        await (0, Plan_1.seedPlansIfEmpty)();
        const docs = await Plan_1.PlanModel.find()
            .sort({ displayOrder: 1, priceCents: 1 })
            .lean();
        const plans = docs.map(d => this.mapDocToPlan(d));
        this.allPlansCache = { data: plans, expiry: now + this.CACHE_TTL_MS };
        return plans;
    }
    async getPlanById(id) {
        const normalized = id.startsWith('PLAN_') ? id : `PLAN_${id.toUpperCase()}`;
        if (mongoose_1.default.connection.readyState === 1) {
            await (0, Plan_1.seedPlansIfEmpty)();
            const doc = await Plan_1.PlanModel.findOne({
                $or: [{ planId: id }, { planId: normalized }]
            }).lean();
            if (doc) {
                return this.mapDocToPlan(doc);
            }
        }
        return plans_1.SUBSCRIPTION_PLANS[id] || plans_1.SUBSCRIPTION_PLANS[normalized];
    }
    async createPlan(input, adminId) {
        if (mongoose_1.default.connection.readyState !== 1) {
            throw apiError_1.ApiError.internal('Database is not currently connected');
        }
        await (0, Plan_1.seedPlansIfEmpty)();
        const planId = input.id
            ? input.id.trim().toUpperCase().replace(/\s+/g, '_')
            : `PLAN_${input.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
        const existing = await Plan_1.PlanModel.findOne({ planId });
        if (existing) {
            throw apiError_1.ApiError.badRequest(`Plan with identifier "${planId}" already exists`);
        }
        const durationDays = input.durationUnit === 'DAYS'
            ? input.durationValue
            : input.durationValue * 30;
        const count = await Plan_1.PlanModel.countDocuments();
        const displayOrder = input.displayOrder !== undefined ? input.displayOrder : count;
        const doc = await Plan_1.PlanModel.create({
            planId,
            name: input.name.trim(),
            badge: input.badge?.trim() || undefined,
            description: input.description.trim(),
            priceCents: input.priceCents,
            duration: {
                unit: input.durationUnit,
                value: input.durationValue
            },
            durationDays,
            features: input.features || [],
            isPopular: !!input.isPopular,
            isActive: input.isActive !== false,
            isVisible: input.isVisible !== false,
            displayOrder
        });
        this.clearPlanCache();
        if (adminId) {
            const admin = await User_1.UserModel.findById(adminId);
            await AuditLog_1.AuditLogModel.create({
                action: 'PLAN_CREATED',
                adminId: new mongoose_1.default.Types.ObjectId(adminId),
                adminEmail: admin?.email || 'admin@roulette.tools',
                targetResourceId: planId,
                resourceType: 'SubscriptionPlan',
                reason: `Admin created new plan ${planId}`,
                newValue: {
                    planId,
                    name: doc.name,
                    priceCents: doc.priceCents,
                    durationDays: doc.durationDays
                }
            });
        }
        return this.mapDocToPlan(doc);
    }
    async updatePlan(planId, input, adminId) {
        if (mongoose_1.default.connection.readyState !== 1) {
            throw apiError_1.ApiError.internal('Database is not currently connected');
        }
        await (0, Plan_1.seedPlansIfEmpty)();
        const normalized = planId.startsWith('PLAN_') ? planId : `PLAN_${planId.toUpperCase()}`;
        const planDoc = await Plan_1.PlanModel.findOne({
            $or: [{ planId }, { planId: normalized }]
        });
        if (!planDoc) {
            throw apiError_1.ApiError.notFound(`Plan with id ${planId} was not found`);
        }
        const previousPriceCents = planDoc.priceCents;
        const previousState = {
            priceCents: planDoc.priceCents,
            name: planDoc.name,
            isActive: planDoc.isActive,
            isVisible: planDoc.isVisible
        };
        if (input.priceCents !== undefined) {
            if (!Number.isInteger(input.priceCents) || input.priceCents < 100) {
                throw apiError_1.ApiError.badRequest('Price must be a valid positive integer in cents (minimum 100 cents / $1.00)');
            }
            planDoc.priceCents = input.priceCents;
        }
        if (input.name !== undefined)
            planDoc.name = input.name.trim();
        if (input.badge !== undefined)
            planDoc.badge = input.badge?.trim() || undefined;
        if (input.description !== undefined)
            planDoc.description = input.description.trim();
        if (input.features !== undefined)
            planDoc.features = input.features;
        if (input.isPopular !== undefined)
            planDoc.isPopular = !!input.isPopular;
        if (input.isActive !== undefined)
            planDoc.isActive = !!input.isActive;
        if (input.isVisible !== undefined)
            planDoc.isVisible = !!input.isVisible;
        if (input.displayOrder !== undefined)
            planDoc.displayOrder = input.displayOrder;
        if (input.durationUnit && input.durationValue) {
            planDoc.duration = {
                unit: input.durationUnit,
                value: Number(input.durationValue)
            };
            planDoc.durationDays = input.durationUnit === 'DAYS' ? Number(input.durationValue) : Number(input.durationValue) * 30;
        }
        await planDoc.save();
        this.clearPlanCache();
        if (adminId) {
            const admin = await User_1.UserModel.findById(adminId);
            const isPriceChange = input.priceCents !== undefined && input.priceCents !== previousPriceCents;
            await AuditLog_1.AuditLogModel.create({
                action: isPriceChange ? 'PLAN_PRICE_UPDATE' : 'PLAN_CONFIG_UPDATE',
                adminId: new mongoose_1.default.Types.ObjectId(adminId),
                adminEmail: admin?.email || 'admin@roulette.tools',
                targetResourceId: planId,
                resourceType: 'SubscriptionPlan',
                reason: input.reason || `Admin updated plan ${planId} configuration / pricing`,
                previousValue: previousState,
                newValue: {
                    priceCents: planDoc.priceCents,
                    name: planDoc.name,
                    isActive: planDoc.isActive,
                    isVisible: planDoc.isVisible,
                    displayOrder: planDoc.displayOrder
                }
            });
        }
        return this.mapDocToPlan(planDoc);
    }
    async deletePlan(planId, adminId) {
        if (mongoose_1.default.connection.readyState !== 1) {
            throw apiError_1.ApiError.internal('Database is not currently connected');
        }
        const normalized = planId.startsWith('PLAN_') ? planId : `PLAN_${planId.toUpperCase()}`;
        const planDoc = await Plan_1.PlanModel.findOne({
            $or: [{ planId }, { planId: normalized }]
        });
        if (!planDoc) {
            throw apiError_1.ApiError.notFound(`Plan ${planId} not found`);
        }
        const activeSubsCount = await Subscription_1.SubscriptionModel.countDocuments({
            planId: { $in: [planId, normalized] },
            status: 'ACTIVE'
        });
        if (activeSubsCount > 0) {
            planDoc.isActive = false;
            planDoc.isVisible = false;
            await planDoc.save();
        }
        else {
            await Plan_1.PlanModel.deleteOne({ _id: planDoc._id });
        }
        this.clearPlanCache();
        if (adminId) {
            const admin = await User_1.UserModel.findById(adminId);
            await AuditLog_1.AuditLogModel.create({
                action: 'PLAN_DELETED',
                adminId: new mongoose_1.default.Types.ObjectId(adminId),
                adminEmail: admin?.email || 'admin@roulette.tools',
                targetResourceId: planId,
                resourceType: 'SubscriptionPlan',
                reason: `Admin deleted or archived plan ${planId}`
            });
        }
        return { success: true, message: `Plan ${planId} removed/archived successfully` };
    }
    async getUserSubscriptions(userId) {
        return subscription_repository_1.subscriptionRepository.findByUserId(userId);
    }
    async getUserActiveSubscription(userId) {
        return subscription_repository_1.subscriptionRepository.findActiveByUserId(userId);
    }
}
exports.SubscriptionService = SubscriptionService;
exports.subscriptionService = new SubscriptionService();
//# sourceMappingURL=subscription.service.js.map