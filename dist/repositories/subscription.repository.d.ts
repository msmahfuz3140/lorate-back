import { ISubscription } from '../models/Subscription';
import { SubscriptionStatus } from '../shared/subscriptions';
import mongoose from 'mongoose';
export declare class SubscriptionRepository {
    findActiveByUserId(userId: string | mongoose.Types.ObjectId): Promise<ISubscription | null>;
    findByUserId(userId: string | mongoose.Types.ObjectId): Promise<ISubscription[]>;
    create(data: {
        userId: mongoose.Types.ObjectId;
        planId: string;
        status: SubscriptionStatus;
        startDate: Date;
        endDate: Date;
        paymentId?: mongoose.Types.ObjectId;
    }): Promise<ISubscription>;
    updateStatus(id: string, status: SubscriptionStatus): Promise<ISubscription | null>;
}
export declare const subscriptionRepository: SubscriptionRepository;
