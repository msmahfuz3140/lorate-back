"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const payment_service_1 = require("../services/payment.service");
const nowpayments_service_1 = require("../services/nowpayments.service");
const subscriptionAccess_service_1 = require("../services/subscriptionAccess.service");
const User_1 = require("../models/User");
const Payment_1 = require("../models/Payment");
const Subscription_1 = require("../models/Subscription");
const FinancialLedger_1 = require("../models/FinancialLedger");
const ReferralCommission_1 = require("../models/ReferralCommission");
const roles_1 = require("../shared/roles");
const subscriptions_1 = require("../shared/subscriptions");
const plans_1 = require("../shared/plans");
const crypto_1 = require("../utils/crypto");
let mongod;
const TEST_IPN_SECRET = 'test_ipn_secret_nowpayments_mock_secure_hash_key_12345';
async function setupTestDb() {
    mongod = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose_1.default.connect(uri);
    console.log('Phase 5 Test in-memory MongoDB connected.');
}
async function teardownTestDb() {
    await mongoose_1.default.disconnect();
    await mongod.stop();
    console.log('Phase 5 Test in-memory MongoDB stopped.');
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
async function runPhase5Tests() {
    console.log('\n=============================================');
    console.log('  STARTING PHASE 5 TEST SUITE');
    console.log('  NOWPayments Production Integration & IPN');
    console.log('=============================================\n');
    try {
        await setupTestDb();
        // -------------------------------------------------------------
        // Base Users Setup
        // -------------------------------------------------------------
        const superAdmin = await User_1.UserModel.create({
            name: 'Super Admin PayManager',
            email: 'superadmin_pay@roulette.tools',
            passwordHash: await (0, crypto_1.hashPassword)('AdminPass123!'),
            role: roles_1.UserRole.SUPER_ADMIN,
            isEmailVerified: true
        });
        const moderator = await User_1.UserModel.create({
            name: 'Partner Mod Affiliate',
            email: 'affiliate_mod@roulette.tools',
            passwordHash: await (0, crypto_1.hashPassword)('ModPass123!'),
            role: roles_1.UserRole.MODERATOR,
            referralCode: 'MOD_REF_PARTNER_01',
            isEmailVerified: true
        });
        const standardBuyer = await User_1.UserModel.create({
            name: 'Crypto Payer One',
            email: 'buyer1@example.com',
            passwordHash: await (0, crypto_1.hashPassword)('BuyerPass123!'),
            role: roles_1.UserRole.USER,
            isEmailVerified: true
        });
        const referredBuyer = await User_1.UserModel.create({
            name: 'Referred Crypto Payer',
            email: 'buyer_referred@example.com',
            passwordHash: await (0, crypto_1.hashPassword)('BuyerPass123!'),
            role: roles_1.UserRole.USER,
            referredBy: moderator._id,
            isEmailVerified: true
        });
        const renewingBuyer = await User_1.UserModel.create({
            name: 'Renewing Subscriber',
            email: 'renewing@example.com',
            passwordHash: await (0, crypto_1.hashPassword)('BuyerPass123!'),
            role: roles_1.UserRole.USER,
            isEmailVerified: true
        });
        // -------------------------------------------------------------
        // SUITE 1: Purchase Order Creation & Snapshotting
        // -------------------------------------------------------------
        console.log('[Suite 1: Purchase Order Creation & Snapshotting]');
        const order1 = await payment_service_1.paymentService.createPurchaseOrder(standardBuyer._id.toString(), 'PLAN_1_MONTH', 'USDTTRC20');
        assert(order1.orderId.startsWith('ORD_'), 'Generates standard ORD_ prefix orderId');
        assert(order1.priceUsd === 200, 'Authoritative plan priceUsd snapshot is $200');
        assert(order1.priceCents === 20000, 'Authoritative plan priceCents snapshot is 20,000');
        assert(order1.status === subscriptions_1.PaymentStatus.WAITING, 'Order initialized to WAITING status');
        assert(Boolean(order1.checkoutUrl), 'Checkout URL generated for client redirection');
        // -------------------------------------------------------------
        // SUITE 2: Successful Qualifying Payment & Subscription Activation
        // -------------------------------------------------------------
        console.log('\n[Suite 2: Qualifying Payment & Subscription Activation]');
        const ipnPayloadSuccess = {
            payment_id: 1000101,
            payment_status: 'finished',
            pay_address: 'TX_USDT_TRC20_WALLET_ADDRESS_DEMO_01',
            price_amount: 200,
            price_currency: 'usd',
            pay_amount: 200,
            actually_paid: 200,
            pay_currency: 'usdttrc20',
            order_id: order1.orderId,
            order_description: 'Roulette.tools — 1 Month Pro',
            purchase_id: 'PURCHASE_1001'
        };
        const sigSuccess = nowpayments_service_1.nowPaymentsService.generateIpnSignature(ipnPayloadSuccess, TEST_IPN_SECRET);
        const resultSuccess = await payment_service_1.paymentService.processIpnCallback(ipnPayloadSuccess, sigSuccess, TEST_IPN_SECRET);
        assert(resultSuccess.success === true, 'processIpnCallback returns success: true');
        assert(resultSuccess.status === subscriptions_1.PaymentStatus.FINISHED, 'Payment status updated to FINISHED');
        assert(resultSuccess.isFulfilled === true, 'Order marked as fulfilled');
        assert(Boolean(resultSuccess.subscriptionId), 'Subscription created and linked to payment');
        // Verify database state for fulfilled payment
        const dbPayment = await Payment_1.PaymentModel.findOne({ orderId: order1.orderId });
        assert(dbPayment?.status === subscriptions_1.PaymentStatus.FINISHED, 'Database payment status is FINISHED');
        assert(dbPayment?.isFulfilled === true, 'Database payment isFulfilled flag is true');
        assert(dbPayment?.subscriptionId?.toString() === resultSuccess.subscriptionId, 'Database subscriptionId reference matches');
        // Verify Financial Ledger Entry
        const ledgerEntry = await FinancialLedger_1.FinancialLedgerModel.findOne({ orderId: order1.orderId });
        assert(ledgerEntry !== null, 'Immutable Financial Ledger entry was created');
        assert(ledgerEntry?.amountCents === 20000, 'Ledger recorded exactly 20,000 cents');
        assert(ledgerEntry?.status === 'SETTLED', 'Ledger status recorded as SETTLED');
        // Verify user now has live tool access
        const buyer1Access = await subscriptionAccess_service_1.subscriptionAccessService.checkAccess(standardBuyer._id.toString());
        assert(buyer1Access.hasAccess === true, 'Buyer now has confirmed active subscription access');
        assert(buyer1Access.code === 'ACCESS_GRANTED', 'Access code is ACCESS_GRANTED');
        assert(buyer1Access.status === subscriptions_1.SubscriptionStatus.ACTIVE, 'Access status is ACTIVE');
        // -------------------------------------------------------------
        // SUITE 3: Active Subscription Renewal Rule (Continuous Extension)
        // -------------------------------------------------------------
        console.log('\n[Suite 3: Active Subscription Renewal Rule]');
        // Setup user with existing subscription that expires in 15 days
        const now = new Date();
        const existingExpiry = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000); // +15 days
        const preExistingSub = await Subscription_1.SubscriptionModel.create({
            userId: renewingBuyer._id,
            planId: 'PLAN_15_DAYS',
            status: subscriptions_1.SubscriptionStatus.ACTIVE,
            startDate: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            endDate: existingExpiry,
            isManualGrant: false
        });
        // User purchases 3 Months Master plan ($450)
        const renewalOrder = await payment_service_1.paymentService.createPurchaseOrder(renewingBuyer._id.toString(), 'PLAN_3_MONTHS', 'USDTTRC20');
        const ipnPayloadRenewal = {
            payment_id: 1000102,
            payment_status: 'finished',
            price_amount: 450,
            price_currency: 'usd',
            pay_amount: 450,
            actually_paid: 450,
            pay_currency: 'usdttrc20',
            order_id: renewalOrder.orderId
        };
        const sigRenewal = nowpayments_service_1.nowPaymentsService.generateIpnSignature(ipnPayloadRenewal, TEST_IPN_SECRET);
        const resultRenewal = await payment_service_1.paymentService.processIpnCallback(ipnPayloadRenewal, sigRenewal, TEST_IPN_SECRET);
        assert(resultRenewal.success === true, 'Renewal IPN callback processed successfully');
        assert(resultRenewal.isFulfilled === true, 'Renewal order fulfilled');
        // The new subscription end date must extend from preExistingSub.endDate, NOT from now!
        const expectedRenewalEnd = (0, plans_1.calculatePlanExpiration)(existingExpiry, { unit: 'MONTHS', value: 3 });
        const renewingBuyerAccess = await subscriptionAccess_service_1.subscriptionAccessService.checkAccess(renewingBuyer._id.toString());
        assert(renewingBuyerAccess.hasAccess === true, 'Renewing user maintains active access');
        assert(Math.abs(new Date(renewingBuyerAccess.endDate).getTime() - expectedRenewalEnd.getTime()) < 10000, 'Renewal rule: Expiry extended seamlessly from pre-existing expiry date (not from today)');
        // -------------------------------------------------------------
        // SUITE 4: Idempotency & Duplicate Webhook Event Protection
        // -------------------------------------------------------------
        console.log('\n[Suite 4: Idempotency & Duplicate Webhook Protection]');
        const subCountBefore = await Subscription_1.SubscriptionModel.countDocuments({ userId: standardBuyer._id });
        const ledgerCountBefore = await FinancialLedger_1.FinancialLedgerModel.countDocuments({ orderId: order1.orderId });
        // Send the exact same webhook again
        const resultDuplicate = await payment_service_1.paymentService.processIpnCallback(ipnPayloadSuccess, sigSuccess, TEST_IPN_SECRET);
        assert(resultDuplicate.success === true, 'Duplicate webhook returns success: true without error');
        assert(resultDuplicate.duplicate === true, 'Duplicate webhook identifies duplicate: true');
        assert(resultDuplicate.isFulfilled === true, 'Duplicate webhook maintains fulfilled state');
        const subCountAfter = await Subscription_1.SubscriptionModel.countDocuments({ userId: standardBuyer._id });
        const ledgerCountAfter = await FinancialLedger_1.FinancialLedgerModel.countDocuments({ orderId: order1.orderId });
        assert(subCountAfter === subCountBefore, 'Duplicate webhook did NOT create duplicate subscription');
        assert(ledgerCountAfter === ledgerCountBefore, 'Duplicate webhook did NOT duplicate financial ledger entry');
        // -------------------------------------------------------------
        // SUITE 5: Cryptographic Webhook Signature Enforcement
        // -------------------------------------------------------------
        console.log('\n[Suite 5: Cryptographic Webhook Signature Enforcement]');
        let signatureRejected = false;
        try {
            await payment_service_1.paymentService.processIpnCallback(ipnPayloadSuccess, 'invalid_fake_tampered_signature_hex', TEST_IPN_SECRET);
        }
        catch (err) {
            if (err.statusCode === 401)
                signatureRejected = true;
        }
        assert(signatureRejected === true, 'Invalid cryptographic signature rejected with HTTP 401 Unauthorized');
        let missingSignatureRejected = false;
        try {
            await payment_service_1.paymentService.processIpnCallback(ipnPayloadSuccess, undefined, TEST_IPN_SECRET);
        }
        catch (err) {
            if (err.statusCode === 401)
                missingSignatureRejected = true;
        }
        assert(missingSignatureRejected === true, 'Missing signature header rejected with HTTP 401 Unauthorized');
        // -------------------------------------------------------------
        // SUITE 6: Security Validation (Amount & Currency Mismatch Guard)
        // -------------------------------------------------------------
        console.log('\n[Suite 6: Security Validation (Amount & Currency Tampering)]');
        const orderTamper = await payment_service_1.paymentService.createPurchaseOrder(standardBuyer._id.toString(), 'PLAN_1_YEAR', 'USDTTRC20'); // $1,000
        // Tampered amount: Attacker tries to confirm a $1,000 plan by sending $10
        const ipnTamperedAmount = {
            payment_id: 1000103,
            payment_status: 'finished',
            price_amount: 10, // Tampered! Expected 1,000
            price_currency: 'usd',
            order_id: orderTamper.orderId
        };
        const sigTamperedAmount = nowpayments_service_1.nowPaymentsService.generateIpnSignature(ipnTamperedAmount, TEST_IPN_SECRET);
        const resultTamperedAmount = await payment_service_1.paymentService.processIpnCallback(ipnTamperedAmount, sigTamperedAmount, TEST_IPN_SECRET);
        assert(resultTamperedAmount.success === false, 'Tampered amount callback returns success: false');
        assert(resultTamperedAmount.isFulfilled === false, 'Tampered amount did NOT fulfill order');
        assert(resultTamperedAmount.status === subscriptions_1.PaymentStatus.REVIEW_REQUIRED, 'Order flagged as REVIEW_REQUIRED');
        // Tampered currency: Attacker sends EUR instead of USD
        const orderTamperCurr = await payment_service_1.paymentService.createPurchaseOrder(standardBuyer._id.toString(), 'PLAN_6_MONTHS', 'USDTTRC20');
        const ipnTamperedCurr = {
            payment_id: 1000104,
            payment_status: 'finished',
            price_amount: 700,
            price_currency: 'eur', // Tampered! Expected USD
            order_id: orderTamperCurr.orderId
        };
        const sigTamperedCurr = nowpayments_service_1.nowPaymentsService.generateIpnSignature(ipnTamperedCurr, TEST_IPN_SECRET);
        const resultTamperedCurr = await payment_service_1.paymentService.processIpnCallback(ipnTamperedCurr, sigTamperedCurr, TEST_IPN_SECRET);
        assert(resultTamperedCurr.success === false, 'Tampered currency callback returns success: false');
        assert(resultTamperedCurr.status === subscriptions_1.PaymentStatus.REVIEW_REQUIRED, 'Order flagged as REVIEW_REQUIRED');
        // -------------------------------------------------------------
        // SUITE 7: Underpayment Handling (partially_paid)
        // -------------------------------------------------------------
        console.log('\n[Suite 7: Underpayment Handling (partially_paid)]');
        const orderUnderpay = await payment_service_1.paymentService.createPurchaseOrder(standardBuyer._id.toString(), 'PLAN_1_MONTH', 'USDTTRC20');
        const ipnUnderpay = {
            payment_id: 1000105,
            payment_status: 'partially_paid',
            price_amount: 200,
            price_currency: 'usd',
            pay_amount: 200,
            actually_paid: 120, // Only $120 of $200 sent
            pay_currency: 'usdttrc20',
            order_id: orderUnderpay.orderId
        };
        const sigUnderpay = nowpayments_service_1.nowPaymentsService.generateIpnSignature(ipnUnderpay, TEST_IPN_SECRET);
        const resultUnderpay = await payment_service_1.paymentService.processIpnCallback(ipnUnderpay, sigUnderpay, TEST_IPN_SECRET);
        assert(resultUnderpay.status === subscriptions_1.PaymentStatus.PARTIALLY_PAID, 'Order marked as PARTIALLY_PAID');
        assert(resultUnderpay.isFulfilled === false, 'Underpaid order was NOT fulfilled');
        // -------------------------------------------------------------
        // SUITE 8: Terminal Failure & Expiration States
        // -------------------------------------------------------------
        console.log('\n[Suite 8: Failure & Expiration States]');
        const orderFail = await payment_service_1.paymentService.createPurchaseOrder(standardBuyer._id.toString(), 'PLAN_15_DAYS', 'USDTTRC20');
        const ipnFail = {
            payment_id: 1000106,
            payment_status: 'failed',
            price_amount: 150,
            price_currency: 'usd',
            order_id: orderFail.orderId
        };
        const sigFail = nowpayments_service_1.nowPaymentsService.generateIpnSignature(ipnFail, TEST_IPN_SECRET);
        const resultFail = await payment_service_1.paymentService.processIpnCallback(ipnFail, sigFail, TEST_IPN_SECRET);
        assert(resultFail.status === subscriptions_1.PaymentStatus.FAILED, 'Failed payment marked as FAILED');
        assert(resultFail.isFulfilled === false, 'Failed payment does not activate subscription');
        const orderExp = await payment_service_1.paymentService.createPurchaseOrder(standardBuyer._id.toString(), 'PLAN_15_DAYS', 'USDTTRC20');
        const ipnExp = {
            payment_id: 1000107,
            payment_status: 'expired',
            price_amount: 150,
            price_currency: 'usd',
            order_id: orderExp.orderId
        };
        const sigExp = nowpayments_service_1.nowPaymentsService.generateIpnSignature(ipnExp, TEST_IPN_SECRET);
        const resultExp = await payment_service_1.paymentService.processIpnCallback(ipnExp, sigExp, TEST_IPN_SECRET);
        assert(resultExp.status === subscriptions_1.PaymentStatus.EXPIRED, 'Expired payment marked as EXPIRED');
        assert(resultExp.isFulfilled === false, 'Expired payment does not activate subscription');
        // -------------------------------------------------------------
        // SUITE 9: Unknown Order ID Safe Handling
        // -------------------------------------------------------------
        console.log('\n[Suite 9: Unknown Order Handling]');
        const ipnUnknown = {
            payment_id: 9999999,
            payment_status: 'finished',
            price_amount: 200,
            price_currency: 'usd',
            order_id: 'ORD_NONEXISTENT_99999'
        };
        const sigUnknown = nowpayments_service_1.nowPaymentsService.generateIpnSignature(ipnUnknown, TEST_IPN_SECRET);
        const resultUnknown = await payment_service_1.paymentService.processIpnCallback(ipnUnknown, sigUnknown, TEST_IPN_SECRET);
        assert(resultUnknown.success === false, 'Unknown order returns success: false');
        assert(resultUnknown.isFulfilled === false, 'Unknown order is not fulfilled');
        // -------------------------------------------------------------
        // SUITE 10: Moderator Referral Commission Attribution (50%)
        // -------------------------------------------------------------
        console.log('\n[Suite 10: Moderator Commission Attribution (50%)]');
        const referredOrder = await payment_service_1.paymentService.createPurchaseOrder(referredBuyer._id.toString(), 'PLAN_1_MONTH', 'USDTTRC20'); // $200
        const ipnReferred = {
            payment_id: 1000108,
            payment_status: 'finished',
            price_amount: 200,
            price_currency: 'usd',
            order_id: referredOrder.orderId
        };
        const sigReferred = nowpayments_service_1.nowPaymentsService.generateIpnSignature(ipnReferred, TEST_IPN_SECRET);
        await payment_service_1.paymentService.processIpnCallback(ipnReferred, sigReferred, TEST_IPN_SECRET);
        const commission = await ReferralCommission_1.ReferralCommissionModel.findOne({ orderId: referredOrder.orderId });
        // Or matched by referredUserId
        const modCommission = await ReferralCommission_1.ReferralCommissionModel.findOne({ referredUserId: referredBuyer._id });
        assert(modCommission !== null, 'Moderator referral commission record was created');
        assert(modCommission?.moderatorId.toString() === moderator._id.toString(), 'Commission assigned to correct Moderator');
        assert(modCommission?.amountUsd === 100, 'Commission is exactly 50% ($100 on $200 sale)');
        assert(modCommission?.status === 'CREDITED', 'Commission status is CREDITED');
        // -------------------------------------------------------------
        // SUITE 11: Admin Payment Management & Reporting
        // -------------------------------------------------------------
        console.log('\n[Suite 11: Admin Payment Management & Reporting]');
        // 1. Search by user email
        const searchRes = await payment_service_1.paymentService.getAdminOrders({ search: 'buyer1@example.com' });
        assert(searchRes.orders.length > 0, 'Admin can search orders by customer email');
        // 2. Filter by status
        const finishedOrders = await payment_service_1.paymentService.getAdminOrders({ status: subscriptions_1.PaymentStatus.FINISHED });
        assert(finishedOrders.orders.every(o => o.status === subscriptions_1.PaymentStatus.FINISHED), 'Admin can filter orders by status');
        // 3. Admin Financial Summary
        const summary = await payment_service_1.paymentService.getAdminSummary();
        assert(summary.totalOrders > 0, 'Admin summary counts total orders');
        assert(summary.completedOrders > 0, 'Admin summary counts completed orders');
        assert(summary.totalGrossUsd > 0, 'Admin summary computes total gross USD');
        // 4. Admin Export Report
        const exportData = await payment_service_1.paymentService.exportAdminReport();
        assert(exportData.count > 0, 'Export report includes order count');
        assert(exportData.csv.includes('Order ID,Payment ID,Customer Email'), 'Export report generates standard CSV headers');
        assert(exportData.csv.includes(order1.orderId), 'Export report includes created order IDs');
        // -------------------------------------------------------------
        // Test Summary
        // -------------------------------------------------------------
        console.log('\n=============================================');
        console.log(`  PHASE 5 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
        console.log('=============================================\n');
        if (failedTests > 0) {
            process.exit(1);
        }
    }
    catch (error) {
        console.error('Unhandled test suite failure in Phase 5:', error);
        process.exit(1);
    }
    finally {
        await teardownTestDb();
    }
}
runPhase5Tests();
//# sourceMappingURL=phase5.test.js.map