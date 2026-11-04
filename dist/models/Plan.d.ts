import mongoose, { Document } from 'mongoose';
import { PlanDuration } from '../shared/plans';
export interface IPlanDocument extends Document {
    planId: string;
    name: string;
    badge?: string;
    description: string;
    priceCents: number;
    duration: PlanDuration;
    durationDays: number;
    features: string[];
    isPopular: boolean;
    isActive: boolean;
    isVisible: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare const PlanModel: mongoose.Model<any, {}, {}, {}, any, any>;
/**
 * Ensures initial 5 authoritative plans exist in the database.
 * Only executes query once per process lifetime.
 */
export declare function seedPlansIfEmpty(): Promise<void>;
