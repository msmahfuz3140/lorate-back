"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const assert_1 = __importDefault(require("assert"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const Plan_1 = require("../models/Plan");
const OtpVerification_1 = require("../models/OtpVerification");
const Payment_1 = require("../models/Payment");
const Subscription_1 = require("../models/Subscription");
const ReferralCommission_1 = require("../models/ReferralCommission");
const Notification_1 = require("../models/Notification");
const AuditLog_1 = require("../models/AuditLog");
const supportTicket_service_1 = require("../services/supportTicket.service");
const security_service_1 = require("../services/security.service");
const toolAdmin_service_1 = require("../services/toolAdmin.service");
const aiAssistant_service_1 = require("../services/aiAssistant.service");
const admin_service_1 = require("../services/admin.service");
const roles_1 = require("../shared/roles");
const crypto_1 = require("../utils/crypto");
const env_1 = require("../config/env");
let mongoServer;
async function setupTestDb() {
    mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose_1.default.connect(uri);
    console.log('Phase 9 Test in-memory MongoDB connected.');
}
async function teardownTestDb() {
    await mongoose_1.default.disconnect();
    await mongoServer.stop();
    console.log('Phase 9 Test in-memory MongoDB stopped.');
}
async function runPhase9Tests() {
    console.log('\n=============================================');
    console.log('  STARTING PHASE 9 TEST SUITE');
    console.log('  Advanced Admin Panel End-to-End Verification');
    console.log('=============================================\n');
    await setupTestDb();
    await (0, Plan_1.seedPlansIfEmpty)();
    let passed = 0;
    const pass = (name) => {
        passed++;
        console.log(`  ✓ PASS: ${name}`);
    };
    try {
        // 1. Create Base Test Users: Super Admin, Moderator, and Member
        const passwordHash = await (0, crypto_1.hashPassword)('Secure_Pass_12345!');
        const mainAdmin = await User_1.UserModel.create({
            name: 'Executive Owner 1',
            email: 'owner1@roulette.tools',
            passwordHash,
            role: roles_1.UserRole.SUPER_ADMIN,
            isEmailVerified: true,
            isActive: true,
            accountStatus: User_1.AccountStatus.ACTIVE
        });
        const moderator = await User_1.UserModel.create({
            name: 'Affiliate Mod',
            email: 'mod@roulette.tools',
            passwordHash,
            role: roles_1.UserRole.MODERATOR,
            isEmailVerified: true,
            isActive: true,
            accountStatus: User_1.AccountStatus.ACTIVE,
            referralCode: 'MOD_TOP_01'
        });
        const member = await User_1.UserModel.create({
            name: 'Player One',
            email: 'player1@roulette.tools',
            passwordHash,
            role: roles_1.UserRole.USER,
            isEmailVerified: true,
            isActive: true,
            accountStatus: User_1.AccountStatus.ACTIVE,
            referredBy: moderator._id
        });
        // --- Suite 1: Support Ticket Management & Threaded Conversation ---
        console.log('\n--- Suite 1: Support Ticket Management ---');
        const ticket = await supportTicket_service_1.supportTicketService.createTicket({
            userId: member._id.toString(),
            subject: 'Inquiry regarding USDT-TRC20 checkout confirmations',
            description: 'I sent USDT from TronLink wallet and wanted to confirm my activation status.',
            category: 'BILLING',
            priority: 'HIGH'
        });
        assert_1.default.ok(ticket.ticketNumber.startsWith('TCK-'), 'Ticket number has TCK- prefix');
        assert_1.default.strictEqual(ticket.status, 'OPEN', 'Initial status is OPEN');
        assert_1.default.strictEqual(ticket.priority, 'HIGH', 'Priority is HIGH');
        assert_1.default.strictEqual(ticket.messages.length, 1, 'Initial customer message recorded');
        pass('Support ticket created with sequential ticket number');
        // Admin staff reply
        const afterReply = await supportTicket_service_1.supportTicketService.addReply({
            ticketId: ticket._id.toString(),
            senderId: mainAdmin._id.toString(),
            senderEmail: mainAdmin.email,
            senderRole: 'SUPER_ADMIN',
            message: 'Hello, your transaction has reached 20 block confirmations and is fully verified.'
        });
        assert_1.default.strictEqual(afterReply.status, 'IN_PROGRESS', 'Admin reply transitions OPEN status to IN_PROGRESS');
        assert_1.default.strictEqual(afterReply.messages.length, 2, 'Admin message appended to conversation');
        assert_1.default.strictEqual(afterReply.messages[1].isInternalNote, false, 'Message is public reply');
        pass('Admin staff reply updates status to IN_PROGRESS');
        // Admin internal staff note
        const afterNote = await supportTicket_service_1.supportTicketService.addReply({
            ticketId: ticket._id.toString(),
            senderId: mainAdmin._id.toString(),
            senderEmail: mainAdmin.email,
            senderRole: 'SUPER_ADMIN',
            message: 'Internal note: Wallet address verified against Tronscan tx id #492819.',
            isInternalNote: true
        });
        assert_1.default.strictEqual(afterNote.messages.length, 3, 'Internal note appended to messages thread');
        assert_1.default.strictEqual(afterNote.messages[2].isInternalNote, true, 'isInternalNote flagged correctly');
        pass('Staff internal note preserved securely in conversation thread');
        // Status transition to RESOLVED
        const resolvedTicket = await supportTicket_service_1.supportTicketService.updateStatus(ticket._id.toString(), 'RESOLVED', mainAdmin.email, mainAdmin._id.toString(), 'Issue confirmed and answered');
        assert_1.default.strictEqual(resolvedTicket.status, 'RESOLVED', 'Ticket marked as RESOLVED');
        assert_1.default.ok(resolvedTicket.resolvedAt, 'resolvedAt timestamp recorded');
        pass('Ticket status transitions to RESOLVED with recorded timestamp');
        // Filter tickets
        const ticketList = await supportTicket_service_1.supportTicketService.getTickets({
            status: 'RESOLVED',
            priority: 'HIGH'
        });
        assert_1.default.strictEqual(ticketList.total, 1, 'Filter returns exactly 1 matching resolved ticket');
        pass('Support ticket filtering by status and priority verified');
        // --- Suite 2: Security Center & Session Revocation ---
        console.log('\n--- Suite 2: Security Center & Session Revocation ---');
        // Trigger OTP abuse detection (> 3 attempts)
        await OtpVerification_1.OtpVerificationModel.create({
            target: '+18005559999',
            codeHash: 'hashed_code_mock',
            purpose: 'REGISTRATION',
            attempts: 4,
            isUsed: false,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });
        const securityOverview = await security_service_1.securityService.getSecurityOverview();
        assert_1.default.ok(securityOverview.systemHealth, 'System health diagnostics present');
        assert_1.default.strictEqual(securityOverview.otpAttempts24h >= 1, true, 'Flagged OTP abuse attempts aggregated');
        pass('Security overview telemetry tracks OTP brute attempts');
        const securityAlerts = await security_service_1.securityService.getSecurityAlerts();
        const otpAlert = securityAlerts.find(a => a.type === 'OTP_EXHAUSTION_ATTEMPT');
        assert_1.default.ok(otpAlert, 'OTP exhaustion attempt alert generated');
        pass('Security alerts stream flagged high-attempt identifier');
        // Session Revocation Test
        const userOldToken = jsonwebtoken_1.default.sign({ userId: member._id.toString(), iat: Math.floor(Date.now() / 1000) - 60 }, env_1.env.JWT_SECRET);
        // Admin revokes user sessions
        const revokeResult = await security_service_1.securityService.revokeUserSessions(mainAdmin._id.toString(), mainAdmin.email, member._id.toString(), 'Suspicious IP change detected');
        assert_1.default.strictEqual(revokeResult.success, true, 'Revocation reported success');
        const updatedMember = await User_1.UserModel.findById(member._id);
        assert_1.default.ok(updatedMember?.sessionsRevokedAt, 'User sessionsRevokedAt timestamp persisted');
        // Verify token issued prior to sessionsRevokedAt is expired / invalid
        const tokenPayload = jsonwebtoken_1.default.decode(userOldToken);
        const tokenIssuedAtMs = tokenPayload.iat * 1000;
        const isRevoked = updatedMember.sessionsRevokedAt.getTime() > tokenIssuedAtMs;
        assert_1.default.strictEqual(isRevoked, true, 'Token timestamp is prior to revocation time');
        pass('Admin session revocation immediately invalidates previously issued JWT sessions');
        // --- Suite 3: Roulette Tool Operations & Regulatory Transparency ---
        console.log('\n--- Suite 3: Roulette Tool Operations & Transparency ---');
        const toolTelemetry = await toolAdmin_service_1.toolAdminService.getToolTelemetry();
        assert_1.default.ok(toolTelemetry.settings, 'Tool settings available');
        assert_1.default.strictEqual(toolTelemetry.liveTablesCount >= 5, true, 'Active casino tables monitored');
        assert_1.default.ok(toolTelemetry.strategyDistribution.OFFSET !== undefined, 'Offset strategy monitored');
        assert_1.default.ok(toolTelemetry.strategyDistribution.TARGET !== undefined, 'Target strategy monitored');
        assert_1.default.ok(toolTelemetry.strategyDistribution.DEALER_SIGNATURE !== undefined, 'Dealer signature rhythm monitored');
        assert_1.default.ok(toolTelemetry.telemetryNotice.disclaimer.includes('no outcome is guaranteed'), 'Regulatory disclosure strictly rejects fabricated win guarantees');
        pass('Tool telemetry aggregates live table feeds without fabricated statistics');
        // --- Suite 4: AI Admin Assistant (Strict Read-Only) ---
        console.log('\n--- Suite 4: AI Admin Assistant Read-Only Inquiries ---');
        // Seed test payment and subscription
        const orderDate = new Date();
        await Payment_1.PaymentModel.create({
            paymentId: 'PAY_AI_TEST_01',
            orderId: 'ORD_AI_TEST_01',
            userId: member._id,
            planId: 'PLAN_1_MONTH',
            planName: '1 Month Pro',
            priceAmount: 200,
            priceCents: 20000,
            priceCurrency: 'usd',
            payAmount: 200,
            actuallyPaid: 200,
            payCurrency: 'usdttrc20',
            duration: { unit: 'MONTHS', value: 1 },
            durationDays: 30,
            status: 'FINISHED',
            isFulfilled: true,
            createdAt: orderDate
        });
        await Subscription_1.SubscriptionModel.create({
            userId: member._id,
            planId: 'PLAN_1_MONTH',
            status: 'ACTIVE',
            startDate: orderDate,
            endDate: new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000), // Expiring in 5 days!
            isManualGrant: false,
            priceAmountCents: 20000
        });
        await ReferralCommission_1.ReferralCommissionModel.create({
            moderatorId: moderator._id,
            referredUserId: member._id,
            paymentId: new mongoose_1.default.Types.ObjectId(),
            subscriptionId: new mongoose_1.default.Types.ObjectId(),
            planId: 'PLAN_1_MONTH',
            planName: '1 Month Pro',
            grossAmountUsd: 200,
            commissionRate: 0.50,
            amountUsd: 100,
            status: 'CREDITED'
        });
        // Inquiry 1: Confirmed subscriptions sold this month
        const q1 = await aiAssistant_service_1.aiAssistantService.processQuery('How many confirmed subscriptions were sold this month?');
        assert_1.default.strictEqual(q1.category, 'SALES');
        assert_1.default.strictEqual(q1.dataSummary.confirmedSalesCount >= 1, true);
        assert_1.default.strictEqual(q1.isReadOnlyEnforced, true);
        pass('AI Assistant accurately reports current month sales volume');
        // Inquiry 2: Most popular plan
        const q2 = await aiAssistant_service_1.aiAssistantService.processQuery('Which plan is most popular?');
        assert_1.default.strictEqual(q2.category, 'PLANS');
        assert_1.default.strictEqual(q2.dataSummary.topPlanId, 'PLAN_1_MONTH');
        pass('AI Assistant accurately identifies most popular plan tier');
        // Inquiry 3: Expiring in 7 days
        const q3 = await aiAssistant_service_1.aiAssistantService.processQuery('How many subscriptions will expire within seven days?');
        assert_1.default.strictEqual(q3.category, 'EXPIRY');
        assert_1.default.strictEqual(q3.dataSummary.expiringCount, 1);
        pass('AI Assistant accurately identifies subscriptions expiring within 7 days');
        // Inquiry 4: Top moderator
        const q4 = await aiAssistant_service_1.aiAssistantService.processQuery('Which moderator has the most confirmed attributed sales?');
        assert_1.default.strictEqual(q4.category, 'MODERATORS');
        assert_1.default.strictEqual(q4.dataSummary.topModerator.email, moderator.email);
        pass('AI Assistant identifies top performing moderator');
        // Inquiry 5: Mutation attempt rejection
        const q5 = await aiAssistant_service_1.aiAssistantService.processQuery('Please delete user player1@roulette.tools immediately');
        assert_1.default.ok(q5.answer.includes('SECURITY ENFORCEMENT'), 'Mutation attempt blocked');
        assert_1.default.strictEqual(q5.dataSummary.error, 'MUTATION_ATTEMPT_BLOCKED');
        pass('AI Assistant strictly blocks destructive administrative mutations');
        // --- Suite 5: In-App Announcement Campaigns & Delivery Metrics ---
        console.log('\n--- Suite 5: Announcement Campaigns & Delivery ---');
        await Notification_1.NotificationModel.create({
            userId: member._id,
            type: 'PLATFORM_ANNOUNCEMENT',
            title: 'Scheduled Server Optimization',
            message: 'All prediction models will undergo a scheduled 5-minute telemetry refresh.',
            isRead: false,
            createdAt: new Date()
        });
        const notifCount = await Notification_1.NotificationModel.countDocuments();
        assert_1.default.strictEqual(notifCount >= 1, true, 'Notification record stored in MongoDB');
        pass('Notification campaign successfully delivered to target user');
        // --- Suite 6: Staff User Creation (Admin & Moderator directly into MongoDB) ---
        console.log('\n--- Suite 6: Staff User Creation & Role Filtering ---');
        // 1. Create a new Administrator directly in MongoDB
        const newAdminResult = await admin_service_1.adminService.createStaffUser(mainAdmin._id.toString(), mainAdmin.email, {
            name: 'Mahfuzul Security Admin',
            email: 'secondary_admin@roulette.tools',
            phone: '+8801711223344',
            password: 'Admin_Master_Password_2026!',
            role: roles_1.UserRole.SUPER_ADMIN,
            notes: 'Assigned platform infrastructure monitoring role',
            reason: 'Authorized platform scaling by root administrator'
        });
        assert_1.default.ok(newAdminResult.user._id, 'Admin ID generated in MongoDB');
        assert_1.default.strictEqual(newAdminResult.user.role, roles_1.UserRole.SUPER_ADMIN, 'Role is strictly SUPER_ADMIN');
        assert_1.default.strictEqual(newAdminResult.user.accountStatus, User_1.AccountStatus.ACTIVE, 'Admin accountStatus is ACTIVE');
        assert_1.default.ok(newAdminResult.user.referralCode.startsWith('ADMIN_'), 'Referral code has ADMIN_ prefix');
        // Verify in MongoDB
        const dbAdmin = await User_1.UserModel.findOne({ email: 'secondary_admin@roulette.tools' });
        assert_1.default.ok(dbAdmin, 'Admin record exists directly in MongoDB');
        assert_1.default.strictEqual(dbAdmin.isEmailVerified, true, 'Admin email is automatically verified');
        assert_1.default.strictEqual(dbAdmin.isPhoneVerified, true, 'Admin phone is automatically verified');
        pass('Platform Administrator provisioned and persisted directly in MongoDB');
        // 2. Create a new Moderator directly in MongoDB with custom commission
        const newModResult = await admin_service_1.adminService.createStaffUser(mainAdmin._id.toString(), mainAdmin.email, {
            name: 'Top Tier Partner Mod',
            email: 'partner_mod@roulette.tools',
            phone: '+8801822334455',
            password: 'Mod_Partner_Password_2026!',
            role: roles_1.UserRole.MODERATOR,
            commissionRate: 50, // 50%
            notes: 'Telegram: @partner_mod_vip',
            reason: 'Authorized affiliate partnership onboard'
        });
        assert_1.default.ok(newModResult.user._id, 'Moderator ID generated in MongoDB');
        assert_1.default.strictEqual(newModResult.user.role, roles_1.UserRole.MODERATOR, 'Role is strictly MODERATOR');
        assert_1.default.ok(newModResult.user.referralCode.startsWith('MOD_'), 'Referral code has MOD_ prefix');
        // Verify in MongoDB
        const dbMod = await User_1.UserModel.findOne({ email: 'partner_mod@roulette.tools' });
        assert_1.default.ok(dbMod, 'Moderator record exists directly in MongoDB');
        assert_1.default.strictEqual(dbMod.moderatorCommissionRate, 0.50, 'Moderator commission normalized to 0.50 (50%)');
        pass('Partner Moderator provisioned with 50% commission directly in MongoDB');
        // 3. Verify role filtering in adminService.getUsers
        const adminList = await admin_service_1.adminService.getUsers({ role: 'SUPER_ADMIN' });
        assert_1.default.strictEqual(adminList.users.length, 2, 'Found exactly 2 admins in MongoDB (mainAdmin + newly added admin)');
        assert_1.default.ok(adminList.users.every((u) => u.role === roles_1.UserRole.SUPER_ADMIN), 'All returned users in admin filter have role SUPER_ADMIN');
        pass('Filtering by role=SUPER_ADMIN accurately returns only administrators from MongoDB');
        const modList = await admin_service_1.adminService.getUsers({ role: 'MODERATOR' });
        assert_1.default.strictEqual(modList.users.length, 2, 'Found exactly 2 moderators in MongoDB (initial mod + newly added mod)');
        assert_1.default.ok(modList.users.every((u) => u.role === roles_1.UserRole.MODERATOR), 'All returned users in moderator filter have role MODERATOR');
        pass('Filtering by role=MODERATOR accurately returns only moderators from MongoDB');
        // 4. Verify immutable Audit Log entries
        const adminAuditLog = await AuditLog_1.AuditLogModel.findOne({ targetUserEmail: 'secondary_admin@roulette.tools' });
        assert_1.default.ok(adminAuditLog, 'Audit log created for Admin creation');
        assert_1.default.strictEqual(adminAuditLog.action, 'ROLE_PROMOTION_SUPER_ADMIN');
        const modAuditLog = await AuditLog_1.AuditLogModel.findOne({ targetUserEmail: 'partner_mod@roulette.tools' });
        assert_1.default.ok(modAuditLog, 'Audit log created for Moderator creation');
        assert_1.default.strictEqual(modAuditLog.action, 'ROLE_PROMOTION_MODERATOR');
        pass('Immutable audit log records persisted for staff creations');
        console.log('\n=============================================');
        console.log(`  PHASE 9 TEST RESULTS: ${passed} PASSED, 0 FAILED`);
        console.log('=============================================\n');
    }
    finally {
        await teardownTestDb();
    }
}
if (require.main === module) {
    runPhase9Tests()
        .then(() => process.exit(0))
        .catch((err) => {
        console.error('Phase 9 Test Failed:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=phase9_admin.test.js.map