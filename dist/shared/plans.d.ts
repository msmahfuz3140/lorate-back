/**
 * Authoritative 5 Subscription Plans for the Roulette Prediction Platform
 * As defined in Section 7 of the Project Specification:
 * 1. 15 Days — $150 (15,000 cents)
 * 2. 1 Month — $200 (20,000 cents)
 * 3. 3 Months — $450 (45,000 cents)
 * 4. 6 Months — $700 (70,000 cents)
 * 5. 1 Year — $1,000 (100,000 cents)
 */
export type DurationUnit = 'DAYS' | 'MONTHS';
export interface PlanDuration {
    unit: DurationUnit;
    value: number;
}
export interface SubscriptionPlan {
    id: string;
    name: string;
    badge?: string;
    description: string;
    priceUsd: number;
    priceCents: number;
    duration: PlanDuration;
    durationDays: number;
    features: string[];
    isPopular?: boolean;
    isActive: boolean;
    isVisible: boolean;
    displayOrder?: number;
}
export declare const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan>;
export declare const PLANS_ARRAY: SubscriptionPlan[];
export declare const MODERATOR_COMMISSION_RATE = 0.5;
/**
 * Returns the exact days in a given month of a given year,
 * correctly handling 28/29 days in February for leap years.
 */
export declare function getDaysInMonth(year: number, monthIndex: number): number;
/**
 * Accurately calculates subscription expiration dates.
 * Handles calendar-month boundary conditions and leap-year edge cases.
 * E.g., Jan 31 + 1 month in non-leap year -> Feb 28.
 * E.g., Jan 31 + 1 month in leap year (2028) -> Feb 29.
 */
export declare function calculatePlanExpiration(startDate: Date, duration: PlanDuration): Date;
/**
 * Converts integer cents to formatted USD currency display.
 * Prevents floating-point precision artifacts (e.g. 15000 -> "$150").
 */
export declare function formatCentsToUsd(cents: number): string;
export interface UpdatePlanInput {
    name?: string;
    badge?: string;
    description?: string;
    priceCents?: number;
    durationUnit?: 'DAYS' | 'MONTHS';
    durationValue?: number;
    features?: string[];
    isPopular?: boolean;
    isActive?: boolean;
    isVisible?: boolean;
    displayOrder?: number;
}
export interface CreatePlanInput {
    id?: string;
    name: string;
    badge?: string;
    description: string;
    priceCents: number;
    durationUnit: 'DAYS' | 'MONTHS';
    durationValue: number;
    features: string[];
    isPopular?: boolean;
    isActive?: boolean;
    isVisible?: boolean;
    displayOrder?: number;
}
