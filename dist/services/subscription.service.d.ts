import { SubscriptionPlan, UpdatePlanInput, CreatePlanInput } from '../shared/plans';
export declare class SubscriptionService {
    private publicPlansCache;
    private allPlansCache;
    private readonly CACHE_TTL_MS;
    private clearPlanCache;
    private mapDocToPlan;
    getPublicPlans(): Promise<SubscriptionPlan[]>;
    getAllPlans(): Promise<SubscriptionPlan[]>;
    getPlanById(id: string): Promise<SubscriptionPlan | undefined>;
    createPlan(input: CreatePlanInput, adminId?: string): Promise<SubscriptionPlan>;
    updatePlan(planId: string, input: UpdatePlanInput, adminId?: string): Promise<SubscriptionPlan>;
    deletePlan(planId: string, adminId?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getUserSubscriptions(userId: string): Promise<import("../models/Subscription").ISubscription[]>;
    getUserActiveSubscription(userId: string): Promise<import("../models/Subscription").ISubscription | null>;
}
export declare const subscriptionService: SubscriptionService;
