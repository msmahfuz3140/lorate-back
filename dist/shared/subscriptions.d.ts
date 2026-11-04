import { z } from 'zod';
export declare enum SubscriptionStatus {
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    CANCELLED = "CANCELLED",
    PENDING = "PENDING",
    REVOKED = "REVOKED"
}
export declare enum PaymentStatus {
    WAITING = "WAITING",
    CONFIRMING = "CONFIRMING",
    CONFIRMED = "CONFIRMED",
    SENDING = "SENDING",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    FINISHED = "FINISHED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
    EXPIRED = "EXPIRED",
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
}
export interface NowPaymentsIpnPayload {
    payment_id: number | string;
    payment_status: string;
    pay_address?: string;
    price_amount: number;
    price_currency: string;
    pay_amount?: number;
    actually_paid?: number;
    pay_currency?: string;
    order_id: string;
    order_description?: string;
    purchase_id?: string | number;
    outcome_amount?: number;
    outcome_currency?: string;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}
export interface AdminPaymentFilterInput {
    search?: string;
    status?: PaymentStatus;
    planId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
export interface AdminPaymentSummary {
    totalGrossUsd: number;
    totalOrders: number;
    completedOrders: number;
    pendingOrders: number;
    failedOrders: number;
    reviewRequiredOrders: number;
    grossSalesUsd?: number;
    confirmedCount?: number;
    pendingCount?: number;
    failedCount?: number;
    paymentFeesUsd?: number;
    outstandingCommissionLiabilitiesUsd?: number;
    netRevenueUsd?: number;
}
export declare const CreatePaymentSchema: z.ZodObject<{
    planId: z.ZodString;
    payCurrency: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export interface SubscriptionDTO {
    id: string;
    userId: string;
    planId: string;
    status: SubscriptionStatus;
    startDate: string;
    endDate: string;
    paymentId?: string;
    secretCode?: string;
    isSecretCodeClaimed?: boolean;
    secretCodeClaimedAt?: string;
    isApprovedByAdmin?: boolean;
    approvedAt?: string;
    daysRemaining?: number;
    isManualGrant?: boolean;
    grantReason?: string;
    isRevoked?: boolean;
    revocationReason?: string;
    extensionReason?: string;
    createdAt: string;
}
export interface PaymentDTO {
    id: string;
    userId: string;
    planId: string;
    priceAmount: number;
    priceCurrency: string;
    payAmount?: number;
    payCurrency?: string;
    paymentId: string;
    orderId: string;
    status: PaymentStatus;
    payAddress?: string;
    createdAt: string;
    updatedAt: string;
}
export interface ReferralCommissionDTO {
    id: string;
    moderatorId: string;
    referredUserId: string;
    subscriptionId: string;
    paymentId: string;
    amountUsd: number;
    commissionRate: number;
    status: 'PENDING' | 'CREDITED';
    createdAt: string;
}
export interface AccessStatusResponse {
    hasAccess: boolean;
    reason?: string;
    code?: 'ACCESS_GRANTED' | 'SUBSCRIPTION_REQUIRED' | 'SUBSCRIPTION_EXPIRED' | 'SUBSCRIPTION_REVOKED' | 'UNAUTHENTICATED' | 'TOOL_DISABLED' | 'TOOL_MAINTENANCE' | 'SECRET_CODE_REQUIRED';
    planId?: string;
    planName?: string;
    status?: SubscriptionStatus;
    startDate?: string;
    endDate?: string;
    expiresAtFormatted?: string;
    daysRemaining?: number;
    isRoleBypass?: boolean;
    needsSecretCode?: boolean;
    isApproved?: boolean;
}
export declare const UnlockToolSchema: z.ZodObject<{
    secretCode: z.ZodString;
}, z.core.$strip>;
export type UnlockToolInput = z.infer<typeof UnlockToolSchema>;
export declare const GrantManualSubscriptionSchema: z.ZodObject<{
    targetEmail: z.ZodString;
    planId: z.ZodString;
    reason: z.ZodString;
}, z.core.$strip>;
export type GrantManualSubscriptionInput = z.infer<typeof GrantManualSubscriptionSchema>;
export declare const ExtendSubscriptionSchema: z.ZodObject<{
    subscriptionId: z.ZodString;
    extensionValue: z.ZodNumber;
    extensionUnit: z.ZodEnum<{
        DAYS: "DAYS";
        MONTHS: "MONTHS";
    }>;
    reason: z.ZodString;
}, z.core.$strip>;
export type ExtendSubscriptionInput = z.infer<typeof ExtendSubscriptionSchema>;
export declare const RevokeSubscriptionSchema: z.ZodObject<{
    subscriptionId: z.ZodString;
    reason: z.ZodString;
}, z.core.$strip>;
export type RevokeSubscriptionInput = z.infer<typeof RevokeSubscriptionSchema>;
