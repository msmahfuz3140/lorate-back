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
exports.OtpVerificationModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const auth_1 = require("../shared/auth");
const OtpVerificationSchema = new mongoose_1.Schema({
    target: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true
    },
    codeHash: {
        type: String,
        required: true
    },
    rawCodeDev: {
        type: String
    },
    purpose: {
        type: String,
        enum: Object.values(auth_1.OtpPurpose),
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index automatically cleans expired records
    },
    lastSentAt: {
        type: Date,
        default: Date.now
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    attempts: {
        type: Number,
        default: 0
    },
    ip: {
        type: String
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
// Compound index for quick active lookup
OtpVerificationSchema.index({ target: 1, purpose: 1, isUsed: 1 });
exports.OtpVerificationModel = mongoose_1.default.models.OtpVerification || mongoose_1.default.model('OtpVerification', OtpVerificationSchema);
//# sourceMappingURL=OtpVerification.js.map