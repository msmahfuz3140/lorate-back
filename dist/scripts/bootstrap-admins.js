"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapMainAdmins = bootstrapMainAdmins;
const connection_1 = require("../database/connection");
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
const roles_1 = require("../shared/roles");
const crypto_1 = require("../utils/crypto");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const crypto_2 = __importDefault(require("crypto"));
async function bootstrapMainAdmins(shouldDisconnect = require.main === module) {
    logger_1.logger.info('Checking Main Admin bootstrap status...');
    await connection_1.db.connect();
    // Check existing SUPER_ADMIN count
    const existingSuperAdmins = await User_1.UserModel.find({ role: roles_1.UserRole.SUPER_ADMIN });
    if (existingSuperAdmins.length >= 4) {
        logger_1.logger.warn(`Bootstrap procedure is permanently disabled. Exactly ${existingSuperAdmins.length} Main Admin accounts are already initialized.`);
        if (shouldDisconnect) {
            await connection_1.db.disconnect();
        }
        return;
    }
    const designatedEmails = env_1.env.MAIN_ADMINS.slice(0, 4);
    logger_1.logger.info(`Initializing ${designatedEmails.length} designated Main Admin accounts...`);
    const generatedCredentials = [];
    for (let i = 0; i < designatedEmails.length; i++) {
        const email = designatedEmails[i].toLowerCase().trim();
        const existing = await User_1.UserModel.findOne({ email });
        if (existing) {
            if (existing.role !== roles_1.UserRole.SUPER_ADMIN) {
                existing.role = roles_1.UserRole.SUPER_ADMIN;
                existing.isEmailVerified = true;
                existing.isActive = true;
                await existing.save();
                await AuditLog_1.AuditLogModel.create({
                    action: 'MAIN_ADMIN_BOOTSTRAP',
                    adminId: existing._id,
                    adminEmail: email,
                    targetUserId: existing._id,
                    targetUserEmail: email,
                    reason: 'Initial bootstrap promotion to SUPER_ADMIN',
                    details: { designatedEmailIndex: i + 1 }
                }).catch((err) => logger_1.logger.error('Audit log failed during bootstrap promotion', err));
                logger_1.logger.info(`Promoted designated account to SUPER_ADMIN: ${email}`);
            }
            continue;
        }
        // High-entropy, unique password per Main Admin (no shared credentials)
        const uniqueEntropy = crypto_2.default.randomBytes(6).toString('hex');
        const initialPassword = process.env.ADMIN_DEFAULT_PASSWORD || `Admin_Pass_${uniqueEntropy}!`;
        const passwordHash = await (0, crypto_1.hashPassword)(initialPassword);
        const newAdmin = await User_1.UserModel.create({
            name: `Main Admin ${i + 1}`,
            email,
            passwordHash,
            role: roles_1.UserRole.SUPER_ADMIN,
            isEmailVerified: true,
            isActive: true,
            referralCode: `ADMIN${i + 1}_${(0, crypto_1.generateRandomString)(4).toUpperCase()}`
        });
        await AuditLog_1.AuditLogModel.create({
            action: 'MAIN_ADMIN_BOOTSTRAP',
            adminId: newAdmin._id,
            adminEmail: email,
            targetUserId: newAdmin._id,
            targetUserEmail: email,
            reason: 'First-time owner bootstrap account creation',
            details: { designatedEmailIndex: i + 1, seatNumber: i + 1 }
        }).catch((err) => logger_1.logger.error('Audit log failed during bootstrap account creation', err));
        generatedCredentials.push({
            name: `Main Admin ${i + 1}`,
            email,
            password: initialPassword
        });
        logger_1.logger.info(`Main Admin ${i + 1} initialized: ${email}`);
        if (env_1.env.NODE_ENV === 'development' || env_1.env.NODE_ENV === 'test') {
            logger_1.logger.info(`[DEV ONLY] Initial credentials for ${email}: ${initialPassword}`);
        }
    }
    if (generatedCredentials.length > 0 && env_1.env.NODE_ENV !== 'test') {
        console.log('\n================================================================');
        console.log('       SECURE INITIAL MAIN ADMIN CREDENTIALS GENERATED          ');
        console.log('================================================================');
        console.log('IMPORTANT: Record these individual credentials immediately.');
        console.log('Each Main Admin MUST change their password upon first login.\n');
        generatedCredentials.forEach((c) => {
            console.log(`[${c.name}] Email: ${c.email} | Temporary Password: ${c.password}`);
        });
        console.log('================================================================\n');
    }
    logger_1.logger.info('First-time owner bootstrap procedure completed successfully. Bootstrap is now disabled.');
    if (shouldDisconnect) {
        await connection_1.db.disconnect();
    }
}
if (require.main === module) {
    bootstrapMainAdmins()
        .then(() => process.exit(0))
        .catch((err) => {
        logger_1.logger.error('Bootstrap failed', err);
        process.exit(1);
    });
}
//# sourceMappingURL=bootstrap-admins.js.map