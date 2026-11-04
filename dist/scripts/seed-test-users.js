"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedTestUsers = seedTestUsers;
const connection_1 = require("../database/connection");
const User_1 = require("../models/User");
const Subscription_1 = require("../models/Subscription");
const roles_1 = require("../shared/roles");
const subscriptions_1 = require("../shared/subscriptions");
const crypto_1 = require("../utils/crypto");
const plans_1 = require("../shared/plans");
async function seedTestUsers(shouldDisconnect = true) {
    console.log('Connecting to database to seed designated testing accounts...');
    await connection_1.db.connect();
    const rawPassword = '31403140';
    const passwordHash = await (0, crypto_1.hashPassword)(rawPassword);
    // Clean up any old demo admin accounts
    await User_1.UserModel.deleteMany({
        email: { $in: ['admin@gmail.com', 'demo.admin@roulette.tools', 'admin1@roulette.tools'] }
    });
    const accounts = [
        {
            name: 'Moderator Partner',
            email: 'mod@gmail.com',
            role: roles_1.UserRole.MODERATOR,
            referralCode: 'MOD_TEST',
            commissionRate: 0.50,
            hasActiveSubscription: false
        },
        {
            name: 'Normal Member',
            email: 'normal@gmail.com',
            role: roles_1.UserRole.USER,
            referralCode: 'USER_TEST',
            commissionRate: undefined,
            hasActiveSubscription: true
        }
    ];
    for (const acc of accounts) {
        let user = await User_1.UserModel.findOne({ email: acc.email });
        if (user) {
            user.name = acc.name;
            user.passwordHash = passwordHash;
            user.role = acc.role;
            user.isEmailVerified = true;
            user.isPhoneVerified = true;
            user.isActive = true;
            user.accountStatus = User_1.AccountStatus.ACTIVE;
            if (acc.commissionRate !== undefined) {
                user.moderatorCommissionRate = acc.commissionRate;
            }
            user.sessionsRevokedAt = undefined;
            await user.save();
            console.log(`[UPDATED] ${acc.email} -> Role: ${acc.role}`);
        }
        else {
            user = await User_1.UserModel.create({
                name: acc.name,
                email: acc.email,
                passwordHash,
                role: acc.role,
                isEmailVerified: true,
                isPhoneVerified: true,
                isActive: true,
                accountStatus: User_1.AccountStatus.ACTIVE,
                referralCode: acc.referralCode,
                moderatorCommissionRate: acc.commissionRate
            });
            console.log(`[CREATED] ${acc.email} -> Role: ${acc.role}`);
        }
        // If account has active subscription (Normal user gets 1 Month Pro)
        if (acc.hasActiveSubscription) {
            let sub = await Subscription_1.SubscriptionModel.findOne({
                userId: user._id,
                status: subscriptions_1.SubscriptionStatus.ACTIVE
            });
            const now = new Date();
            const planId = 'PLAN_1_MONTH';
            const plan = plans_1.SUBSCRIPTION_PLANS[planId];
            const endDate = (0, plans_1.calculatePlanExpiration)(now, plan.duration);
            if (sub) {
                sub.planId = planId;
                sub.startDate = now;
                sub.endDate = endDate;
                sub.status = subscriptions_1.SubscriptionStatus.ACTIVE;
                sub.isSecretCodeClaimed = true;
                sub.isApprovedByAdmin = true;
                await sub.save();
            }
            else {
                await Subscription_1.SubscriptionModel.create({
                    userId: user._id,
                    planId,
                    status: subscriptions_1.SubscriptionStatus.ACTIVE,
                    startDate: now,
                    endDate,
                    isManualGrant: true,
                    isSecretCodeClaimed: true,
                    isApprovedByAdmin: true,
                    grantReason: 'Initial setup testing active pass'
                });
            }
            console.log(`[PASS GRANTED] ${plan.name} (${plan.durationDays} days) linked for ${acc.email}`);
        }
    }
    console.log('\n================================================================');
    console.log('       TEST ACCOUNTS SEEDED SUCCESSFULLY (ADMIN REMAINS IN DB)   ');
    console.log('================================================================');
    console.log(' 1. MODERATOR:   mod@gmail.com    -> Access /moredator');
    console.log(' 2. USER:        normal@gmail.com -> Access /dashboard & /dashboard/tool');
    console.log('================================================================\n');
    if (shouldDisconnect) {
        await connection_1.db.disconnect();
    }
}
if (require.main === module) {
    seedTestUsers(true)
        .then(() => process.exit(0))
        .catch((err) => {
        console.error('Failed to seed test users:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=seed-test-users.js.map