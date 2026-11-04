"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = exports.AccountStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const roles_1 = require("../shared/roles");
var AccountStatus;
(function (AccountStatus) {
    AccountStatus["ACTIVE"] = "ACTIVE";
    AccountStatus["SUSPENDED"] = "SUSPENDED";
    AccountStatus["BLOCKED"] = "BLOCKED";
    AccountStatus["DELETED"] = "DELETED";
})(AccountStatus || (exports.AccountStatus = AccountStatus = {}));
const UserSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        default: 'Member'
    },
    email: {
        type: String,
        lowercase: true,
        trim: true,
        unique: true,
        sparse: true,
        index: true
    },
    phone: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        index: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: Object.values(roles_1.UserRole),
        default: roles_1.UserRole.USER,
        index: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: false // Activated after OTP verification
    },
    accountStatus: {
        type: String,
        enum: Object.values(AccountStatus),
        default: AccountStatus.ACTIVE,
        index: true
    },
    suspendedUntil: {
        type: Date
    },
    statusReason: {
        type: String
    },
    statusChangedAt: {
        type: Date
    },
    statusChangedByAdminId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },
    deletedAt: {
        type: Date
    },
    deletionReason: {
        type: String
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    twoFactorSecret: {
        type: String
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true,
        index: true
    },
    referredBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    referredAt: {
        type: Date
    },
    referralCodeUsed: {
        type: String,
        index: true
    },
    moderatorCommissionRate: {
        type: Number,
        min: 0.0,
        max: 1.0
    },
    moderatorNotes: {
        type: String
    },
    registrationIp: {
        type: String
    },
    lastLoginAt: {
        type: Date
    },
    sessionsRevokedAt: {
        type: Date
    }
}, {
    timestamps: true
});
UserSchema.index({ isDeleted: 1, accountStatus: 1, isActive: 1 });
UserSchema.index({ role: 1, isDeleted: 1 });
UserSchema.index({ role: 1, accountStatus: 1 });
UserSchema.index({ isDeleted: 1, accountStatus: 1, role: 1, createdAt: -1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isDeleted: 1, createdAt: -1 });
UserSchema.index({ referredBy: 1, isDeleted: 1 });
exports.UserModel = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.js.map