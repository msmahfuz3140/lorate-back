"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const subscriptionAccess_service_1 = require("../services/subscriptionAccess.service");
const User_1 = require("../models/User");
const Subscription_1 = require("../models/Subscription");
const Payment_1 = require("../models/Payment");
const ReferralCommission_1 = require("../models/ReferralCommission");
const roles_1 = require("../shared/roles");
const subscriptions_1 = require("../shared/subscriptions");
const subscriptionAccess_middleware_1 = require("../middleware/subscriptionAccess.middleware");
const crypto_1 = require("../utils/crypto");
let mongod;
async function setupTestDb() {
    mongod = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose_1.default.connect(uri);
    console.log('Phase 4 Test in-memory MongoDB connected.');
}
async function teardownTestDb() {
    await mongoose_1.default.disconnect();
    await mongod.stop();
    console.log('Phase 4 Test in-memory MongoDB stopped.');
}
let passedTests = 0;
let failedTests = 0;
function assert(condition, testName, errorDetail) {
    if (condition) {
        console.log(`  ✓ PASS: ${testName}`);
        passedTests++;
    }
    else {
        console.error(`  ✗ FAIL: ${testName}`, errorDetail || '');
        failedTests++;
    }
}
async function runPhase4Tests() {
    console.log('\n=============================================');
    console.log('  STARTING PHASE 4 TEST SUITE');
    console.log('=============================================\n');
    try {
        await setupTestDb();
        // -------------------------------------------------------------
        // Setup Base Admin & Test Users
        // -------------------------------------------------------------
        const superAdmin = await User_1.UserModel.create({
            name: 'Super Admin One',
            email: 'superadmin1@roulette.tools',
            passwordHash: await (0, crypto_1.hashPassword)('AdminPass123!'),
            role: roles_1.UserRole.SUPER_ADMIN,
            isEmailVerified: true
        });
        const moderator = await User_1.UserModel.create({
            name: 'Mod Partner One',
            email: 'mod1@roulette.tools',
            passwordHash: await (0, crypto_1.hashPassword)('ModPass123!'),
            role: roles_1.UserRole.MODERATOR,
            isEmailVerified: true
        });
        const member1 = await User_1.UserModel.create({
            name: 'Active Member',
            email: 'active@roulette.tools',
            passwordHash: await (0, crypto_1.hashPassword)('MemberPass123!'),
            role: roles_1.UserRole.USER,
            isEmailVerified: true
        });
        const memberExpired = await User_1.UserModel.create({
            name: 'Expired Member',
            email: 'expired@roulette.tools',
            passwordHash: await (0, crypto_1.hashPassword)('MemberPass123!'),
            role: roles_1.UserRole.USER,
            isEmailVerified: true
        });
        const memberRevoked = await User_1.UserModel.create({
            name: 'Revoked Member',
            email: 'revoked@roulette.tools',
            passwordHash: await (0, crypto_1.hashPassword)('MemberPass123!'),
            role: roles_1.UserRole.USER,
            isEmailVerified: true
        });
        const memberNoSub = await User_1.UserModel.create({
            name: 'No Sub Member',
            email: 'nosub@roulette.tools',
            passwordHash: await (0, crypto_1.hashPassword)('MemberPass123!'),
            role: roles_1.UserRole.USER,
            isEmailVerified: true
        });
        // -------------------------------------------------------------
        // SUITE 1: Active Subscription Verification
        // -------------------------------------------------------------
        console.log('[Suite 1: Active Subscription Access Verification]');
        const now = new Date();
        const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
        const activeSub = await Subscription_1.SubscriptionModel.create({
            userId: member1._id,
            planId: 'PLAN_1_MONTH',
            status: subscriptions_1.SubscriptionStatus.ACTIVE,
            startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000), // started yesterday
            endDate: futureDate
        });
        const activeCheck = await subscriptionAccess_service_1.subscriptionAccessService.checkAccess(member1._id.toString());
        assert(activeCheck.hasAccess === true, 'Active user receives hasAccess: true');
        assert(activeCheck.code === 'ACCESS_GRANTED', 'Active user status code is ACCESS_GRANTED');
        assert(activeCheck.status === subscriptions_1.SubscriptionStatus.ACTIVE, 'Active user status is ACTIVE');
        assert((activeCheck.daysRemaining || 0) >= 29, 'Active user daysRemaining is accurately calculated');
        assert(Boolean(activeCheck.expiresAtFormatted), 'Active user receives formatted expiration date');
        // -------------------------------------------------------------
        // SUITE 2: Dynamic Expiration Enforcement (Dynamic Check)
        // -------------------------------------------------------------
        console.log('\n[Suite 2: Dynamic Server-Side Expiry Enforcement]');
        const pastDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
        const startedWayBack = new Date(now.getTime() - 32 * 24 * 60 * 60 * 1000);
        const expiredSub = await Subscription_1.SubscriptionModel.create({
            userId: memberExpired._id,
            planId: 'PLAN_1_MONTH',
            status: subscriptions_1.SubscriptionStatus.ACTIVE, // Stored as ACTIVE before dynamic check
            startDate: startedWayBack,
            endDate: pastDate
        });
        const expiredCheck = await subscriptionAccess_service_1.subscriptionAccessService.checkAccess(memberExpired._id.toString());
        assert(expiredCheck.hasAccess === false, 'Expired user access is denied (hasAccess: false)');
        assert(expiredCheck.code === 'SUBSCRIPTION_EXPIRED', 'Expired user returns SUBSCRIPTION_EXPIRED code');
        assert(expiredCheck.daysRemaining === 0, 'Expired user daysRemaining is 0');
        // Verify dynamic DB mutation to EXPIRED
        const reloadedExpiredSub = await Subscription_1.SubscriptionModel.findById(expiredSub._id);
        assert(reloadedExpiredSub?.status === subscriptions_1.SubscriptionStatus.EXPIRED, 'Subscription record status was dynamically updated to EXPIRED in the database upon check');
        // -------------------------------------------------------------
        // SUITE 3: Subscription Revocation Handling
        // -------------------------------------------------------------
        console.log('\n[Suite 3: Subscription Revocation Status]');
        const subToRevoke = await Subscription_1.SubscriptionModel.create({
            userId: memberRevoked._id,
            planId: 'PLAN_3_MONTHS',
            status: subscriptions_1.SubscriptionStatus.ACTIVE,
            startDate: now,
            endDate: futureDate
        });
        // Revoke via subscriptionAccessService
        const revokeResult = await subscriptionAccess_service_1.subscriptionAccessService.revokeSubscription(superAdmin._id.toString(), {
            subscriptionId: subToRevoke._id.toString(),
            reason: 'Violation of Terms of Service - unauthorized scraping'
        });
        assert(revokeResult.status === subscriptions_1.SubscriptionStatus.REVOKED, 'Revocation sets status to REVOKED');
        assert(revokeResult.isRevoked === true, 'Revocation sets isRevoked flag to true');
        assert(revokeResult.revocationReason === 'Violation of Terms of Service - unauthorized scraping', 'Revocation stores audit reason');
        const revokedCheck = await subscriptionAccess_service_1.subscriptionAccessService.checkAccess(memberRevoked._id.toString());
        assert(revokedCheck.hasAccess === false, 'Revoked user access is denied (hasAccess: false)');
        assert(revokedCheck.code === 'SUBSCRIPTION_REVOKED', 'Revoked user returns SUBSCRIPTION_REVOKED code');
        assert(revokedCheck.reason?.includes('unauthorized scraping') === true, 'Revoked check includes the specific administrative revocation reason');
        // -------------------------------------------------------------
        // SUITE 4: Missing Subscription Handling
        // -------------------------------------------------------------
        console.log('\n[Suite 4: Missing Subscription Handling]');
        const noSubCheck = await subscriptionAccess_service_1.subscriptionAccessService.checkAccess(memberNoSub._id.toString());
        assert(noSubCheck.hasAccess === false, 'User with no subscriptions is denied access');
        assert(noSubCheck.code === 'SUBSCRIPTION_REQUIRED', 'Missing subscription returns SUBSCRIPTION_REQUIRED code');
        // -------------------------------------------------------------
        // SUITE 5: Role-Based Access Bypass (Main Admins & Moderators)
        // -------------------------------------------------------------
        console.log('\n[Suite 5: Role-Based Access Bypass for Admins and Moderators]');
        const adminCheck = await subscriptionAccess_service_1.subscriptionAccessService.checkAccess(superAdmin._id.toString());
        assert(adminCheck.hasAccess === true, 'Super Admin receives access without personal subscription');
        assert(adminCheck.isRoleBypass === true, 'Super Admin access includes isRoleBypass: true');
        assert(adminCheck.planName === 'Main Admin Unlimited', 'Super Admin planName is Main Admin Unlimited');
        const modCheck = await subscriptionAccess_service_1.subscriptionAccessService.checkAccess(moderator._id.toString());
        assert(modCheck.hasAccess === true, 'Moderator receives access without personal subscription');
        assert(modCheck.isRoleBypass === true, 'Moderator access includes isRoleBypass: true');
        // -------------------------------------------------------------
        // SUITE 6: Main Admin Manual Subscription Grant & Audit Boundary
        // -------------------------------------------------------------
        console.log('\n[Suite 6: Main Admin Manual Subscription Grant & Audit Boundary]');
        const targetUser = await User_1.UserModel.create({
            name: 'Vip Customer',
            email: 'vip@roulette.tools',
            passwordHash: await (0, crypto_1.hashPassword)('VipPass123!'),
            role: roles_1.UserRole.USER,
            isEmailVerified: true
        });
        const paymentCountBefore = await Payment_1.PaymentModel.countDocuments();
        const commissionCountBefore = await ReferralCommission_1.ReferralCommissionModel.countDocuments();
        const manualSub = await subscriptionAccess_service_1.subscriptionAccessService.grantManualSubscription(superAdmin._id.toString(), {
            targetEmail: targetUser.email,
            planId: 'PLAN_1_YEAR',
            reason: 'Complimentary VIP partner tester pass'
        });
        assert(manualSub.isManualGrant === true, 'Manual grant sets isManualGrant: true');
        assert(manualSub.grantReason === 'Complimentary VIP partner tester pass', 'Manual grant records exact audit reason');
        assert(manualSub.grantedByAdminId?.toString() === superAdmin._id.toString(), 'Manual grant records superAdmin ObjectId as grantedByAdminId');
        assert(manualSub.status === subscriptions_1.SubscriptionStatus.ACTIVE, 'Manual grant is immediately ACTIVE');
        // Verify STRICT audit boundary: Zero artificial payments or moderator commissions
        const paymentCountAfter = await Payment_1.PaymentModel.countDocuments();
        const commissionCountAfter = await ReferralCommission_1.ReferralCommissionModel.countDocuments();
        assert(paymentCountAfter === paymentCountCountBeforeOrEqual(paymentCountBefore), 'Manual grant created ZERO artificial payment records');
        assert(commissionCountAfter === commissionCountBefore, 'Manual grant created ZERO artificial moderator commissions');
        const vipCheck = await subscriptionAccess_service_1.subscriptionAccessService.checkAccess(targetUser._id.toString());
        assert(vipCheck.hasAccess === true, 'Target user of manual grant immediately has hasAccess: true');
        assert(vipCheck.planId === 'PLAN_1_YEAR', 'Target user has active PLAN_1_YEAR plan');
        // -------------------------------------------------------------
        // SUITE 7: Main Admin Subscription Extension
        // -------------------------------------------------------------
        console.log('\n[Suite 7: Main Admin Subscription Extension]');
        const priorEndDate = manualSub.endDate.getTime();
        const extendedSub = await subscriptionAccess_service_1.subscriptionAccessService.extendSubscription(superAdmin._id.toString(), {
            subscriptionId: manualSub._id.toString(),
            extensionValue: 30,
            extensionUnit: 'DAYS',
            reason: 'Bonus 30 days loyalty extension'
        });
        assert(extendedSub.endDate.getTime() > priorEndDate, 'Extension pushed subscription endDate forward into the future');
        assert(extendedSub.extensionReason === 'Bonus 30 days loyalty extension', 'Extension recorded extensionReason');
        assert(Boolean(extendedSub.extendedAt), 'Extension recorded extendedAt timestamp');
        // -------------------------------------------------------------
        // SUITE 8: Express Middleware requireActiveSubscription
        // -------------------------------------------------------------
        console.log('\n[Suite 8: Server-Side Authorization Middleware]');
        async function testMiddleware(reqObj) {
            let nextCalled = false;
            let errPassed = null;
            await (0, subscriptionAccess_middleware_1.requireActiveSubscription)(reqObj, {}, ((err) => {
                if (!err)
                    nextCalled = true;
                else
                    errPassed = err;
            }));
            return { nextCalled, errPassed };
        }
        // Test active user with middleware
        const reqActive = { user: { id: member1._id.toString(), email: member1.email, role: member1.role } };
        const resActive = await testMiddleware(reqActive);
        assert(resActive.nextCalled === true, 'requireActiveSubscription middleware calls next() for active subscriber');
        assert(Boolean(reqActive.accessStatus), 'Middleware attaches accessStatus payload to request');
        // Test expired user with middleware
        const reqExpired = { user: { id: memberExpired._id.toString(), email: memberExpired.email, role: memberExpired.role } };
        const resExpired = await testMiddleware(reqExpired);
        assert(resExpired.nextCalled === false, 'requireActiveSubscription middleware blocks expired subscriber');
        assert(resExpired.errPassed?.statusCode === 403, 'Middleware passes HTTP 403 ApiError to next() for expired subscriber');
        assert(resExpired.errPassed?.code === 'SUBSCRIPTION_EXPIRED', 'Middleware passes SUBSCRIPTION_EXPIRED error code');
        // Test missing subscription with middleware
        const reqNoSub = { user: { id: memberNoSub._id.toString(), email: memberNoSub.email, role: memberNoSub.role } };
        const resNoSub = await testMiddleware(reqNoSub);
        assert(resNoSub.nextCalled === false, 'requireActiveSubscription middleware blocks user without subscription');
        assert(resNoSub.errPassed?.statusCode === 403, 'Middleware passes HTTP 403 ApiError for user without subscription');
        assert(resNoSub.errPassed?.code === 'SUBSCRIPTION_REQUIRED', 'Middleware passes SUBSCRIPTION_REQUIRED error code');
        // -------------------------------------------------------------
        // Test Summary
        // -------------------------------------------------------------
        console.log('\n=============================================');
        console.log(`  PHASE 4 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
        console.log('=============================================\n');
        if (failedTests > 0) {
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Unhandled test suite failure:', error);
        process.exit(1);
    }
    finally {
        await teardownTestDb();
    }
}
function paymentCountCountBeforeOrEqual(val) {
    return val;
}
runPhase4Tests();
//# sourceMappingURL=phase4.test.js.map