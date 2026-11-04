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
exports.SupportTicketModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TicketMessageSchema = new mongoose_1.Schema({
    senderId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderEmail: {
        type: String,
        required: true
    },
    senderRole: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    isInternalNote: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { _id: true });
const SupportTicketSchema = new mongoose_1.Schema({
    ticketNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['BILLING', 'TOOL_ACCESS', 'ACCOUNT', 'OTHER'],
        default: 'OTHER',
        index: true
    },
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM',
        index: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
        default: 'OPEN',
        index: true
    },
    assignedToAdminId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    assignedToAdminEmail: {
        type: String
    },
    relatedPaymentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    relatedSubscriptionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    messages: [TicketMessageSchema],
    lastRepliedAt: {
        type: Date
    },
    resolvedAt: {
        type: Date
    },
    closedAt: {
        type: Date
    }
}, {
    timestamps: true
});
SupportTicketSchema.index({ createdAt: -1 });
SupportTicketSchema.index({ status: 1, priority: 1 });
exports.SupportTicketModel = mongoose_1.default.model('SupportTicket', SupportTicketSchema);
//# sourceMappingURL=SupportTicket.js.map