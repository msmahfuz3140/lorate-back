"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeAuthoritativeAdmin = initializeAuthoritativeAdmin;
const User_1 = require("../models/User");
const Subscription_1 = require("../models/Subscription");
const roles_1 = require("../shared/roles");
const subscriptions_1 = require("../shared/subscriptions");
const crypto_1 = require("../utils/crypto");
const logger_1 = require("../utils/logger");
async function initializeAuthoritativeAdmin() {
    try {
        // 1. Remove old demo admin accounts from database if any exist
        await User_1.UserModel.deleteMany({
            email: { $in: ['demo.admin@roulette.tools', 'admin@gmail.com', 'admin1@roulette.tools'] }
        });
        // 2. Check if a Super Admin already exists in the database
        const existingSuperAdmin = await User_1.UserModel.findOne({ role: roles_1.UserRole.SUPER_ADMIN });
        if (existingSuperAdmin) {
            logger_1.logger.info(`Super Admin verified in MongoDB. Preserving existing database records.`);
            return;
        }
        // 3. Fallback: if no Super Admin exists at all, look for configured MAIN_ADMIN_EMAILS in .env
        const envAdminEmail = (process.env.MAIN_ADMIN_EMAILS?.split(',')[0] || '').trim().toLowerCase();
        if (!envAdminEmail) {
            return;
        }
        const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Admin_Init_1234!';
        const passwordHash = await (0, crypto_1.hashPassword)(defaultPassword);
        const admin = await User_1.UserModel.create({
            name: 'Super Admin',
            email: envAdminEmail,
            passwordHash,
            role: roles_1.UserRole.SUPER_ADMIN,
            isEmailVerified: true,
            isPhoneVerified: true,
            isActive: true,
            accountStatus: User_1.AccountStatus.ACTIVE,
            referralCode: 'ADMIN_CHIEF'
        });
        const now = new Date();
        const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        await Subscription_1.SubscriptionModel.create({
            userId: admin._id,
            planId: 'PLAN_1_YEAR',
            status: subscriptions_1.SubscriptionStatus.ACTIVE,
            startDate: now,
            endDate: oneYearLater,
            isManualGrant: true,
            isSecretCodeClaimed: true,
            isApprovedByAdmin: true,
            grantReason: 'Initial platform administrator pass'
        });
        logger_1.logger.info(`Initial Super Admin provisioned from environment config.`);
    }
    catch (err) {
        logger_1.logger.error('Failed to verify authoritative admin in MongoDB', err);
    }
}
//# sourceMappingURL=initAdmin.js.map