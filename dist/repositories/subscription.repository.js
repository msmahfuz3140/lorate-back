"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionRepository = exports.SubscriptionRepository = void 0;
const Subscription_1 = require("../models/Subscription");
const subscriptions_1 = require("../shared/subscriptions");
class SubscriptionRepository {
    async findActiveByUserId(userId) {
        const now = new Date();
        return Subscription_1.SubscriptionModel.findOne({
            userId,
            status: subscriptions_1.SubscriptionStatus.ACTIVE,
            endDate: { $gt: now }
        }).sort({ endDate: -1 });
    }
    async findByUserId(userId) {
        return Subscription_1.SubscriptionModel.find({ userId }).sort({ createdAt: -1 });
    }
    async create(data) {
        return Subscription_1.SubscriptionModel.create(data);
    }
    async updateStatus(id, status) {
        return Subscription_1.SubscriptionModel.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    }
}
exports.SubscriptionRepository = SubscriptionRepository;
exports.subscriptionRepository = new SubscriptionRepository();
//# sourceMappingURL=subscription.repository.js.map