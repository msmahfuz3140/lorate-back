import { ISubscription } from '../models/Subscription';
import { AccessStatusResponse, GrantManualSubscriptionInput, ExtendSubscriptionInput, RevokeSubscriptionInput } from '../shared/subscriptions';
export declare class SubscriptionAccessService {
    /**
     * Authoritative server-side subscription validation.
     * Evaluates user role, subscription status, start/end date boundaries, and revocation status.
     * When a subscription is past its expiry date, dynamically updates database status to EXPIRED.
     */
    checkAccess(userId: string): Promise<AccessStatusResponse>;
    /**
     * Main Admin manual subscription grant.
     * Records manual grant with admin audit metadata and explicitly does NOT create sales/commissions.
     */
    grantManualSubscription(adminId: string, input: GrantManualSubscriptionInput): Promise<ISubscription>;
    /**
     * Main Admin subscription extension.
     */
    extendSubscription(adminId: string, input: ExtendSubscriptionInput): Promise<ISubscription>;
    /**
     * Main Admin subscription revocation.
     */
    revokeSubscription(adminId: string, input: RevokeSubscriptionInput): Promise<ISubscription>;
    /**
     * List platform subscriptions for Main Admin overview with filtering and pagination.
     */
    listAllSubscriptions(options?: {
        status?: string;
        planId?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        subscriptions: any[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    /**
     * Unlock prediction tool using customer's secret activation code
     */
    unlockToolWithSecretCode(userId: string, enteredCode: string): Promise<{
        success: boolean;
        message: string;
    }>;
    /**
     * Admin: Approve subscription and dispatch secret code email to user
     */
    approveSubscriptionAndSendSecretCode(adminId: string, adminEmail: string, subscriptionId: string): Promise<{
        subscription: ISubscription;
        secretCode: string;
    }>;
    /**
     * Admin: Manually unlock tool for a subscription without requiring user to enter code
     */
    manuallyUnlockToolForSubscription(adminId: string, adminEmail: string, subscriptionId: string): Promise<ISubscription>;
}
export declare const subscriptionAccessService: SubscriptionAccessService;
