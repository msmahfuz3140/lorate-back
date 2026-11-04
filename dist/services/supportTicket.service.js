"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportTicketService = exports.SupportTicketService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const SupportTicket_1 = require("../models/SupportTicket");
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
class SupportTicketService {
    /**
     * Create a new support ticket (User or Admin initiated)
     */
    async createTicket(params) {
        const user = await User_1.UserModel.findById(params.userId);
        if (!user) {
            throw apiError_1.ApiError.notFound('User not found');
        }
        const count = await SupportTicket_1.SupportTicketModel.countDocuments();
        const ticketNumber = `TCK-${1000 + count + 1}`;
        const ticket = await SupportTicket_1.SupportTicketModel.create({
            ticketNumber,
            userId: user._id,
            userName: user.name || 'Member',
            userEmail: user.email || user.phone || 'customer@roulette.tools',
            subject: params.subject.trim(),
            description: params.description.trim(),
            category: params.category || 'OTHER',
            priority: params.priority || 'MEDIUM',
            status: 'OPEN',
            relatedPaymentId: params.relatedPaymentId ? new mongoose_1.default.Types.ObjectId(params.relatedPaymentId) : undefined,
            relatedSubscriptionId: params.relatedSubscriptionId ? new mongoose_1.default.Types.ObjectId(params.relatedSubscriptionId) : undefined,
            messages: [
                {
                    senderId: user._id,
                    senderEmail: user.email || user.phone || 'customer@roulette.tools',
                    senderRole: user.role,
                    message: params.description.trim(),
                    isInternalNote: false,
                    createdAt: new Date()
                }
            ]
        });
        logger_1.logger.info(`Support ticket created: ${ticket.ticketNumber} for ${user.email}`);
        return ticket;
    }
    /**
     * List tickets with pagination, filters, and full text search
     */
    async getTickets(filter) {
        const page = Math.max(1, filter.page || 1);
        const limit = Math.min(100, Math.max(1, filter.limit || 20));
        const skip = (page - 1) * limit;
        const query = {};
        if (filter.status && filter.status !== 'ALL') {
            query.status = filter.status;
        }
        if (filter.priority && filter.priority !== 'ALL') {
            query.priority = filter.priority;
        }
        if (filter.category && filter.category !== 'ALL') {
            query.category = filter.category;
        }
        if (filter.search && filter.search.trim() !== '') {
            const sanitized = filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(sanitized, 'i');
            query.$or = [
                { ticketNumber: regex },
                { subject: regex },
                { userEmail: regex },
                { userName: regex }
            ];
        }
        const [tickets, total] = await Promise.all([
            SupportTicket_1.SupportTicketModel.find(query)
                .populate('assignedToAdminId', 'name email')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),
            SupportTicket_1.SupportTicketModel.countDocuments(query)
        ]);
        return { tickets, total, page, limit };
    }
    /**
     * Get single ticket by ID
     */
    async getTicketById(ticketId) {
        const ticket = await SupportTicket_1.SupportTicketModel.findById(ticketId)
            .populate('userId', 'name email phone role accountStatus')
            .populate('assignedToAdminId', 'name email')
            .populate('relatedPaymentId')
            .populate('relatedSubscriptionId');
        if (!ticket) {
            throw apiError_1.ApiError.notFound(`Ticket ${ticketId} not found`);
        }
        return ticket;
    }
    /**
     * Add a reply or internal note to a ticket
     */
    async addReply(params) {
        const ticket = await SupportTicket_1.SupportTicketModel.findById(params.ticketId);
        if (!ticket) {
            throw apiError_1.ApiError.notFound('Ticket not found');
        }
        const isInternal = !!params.isInternalNote;
        ticket.messages.push({
            senderId: new mongoose_1.default.Types.ObjectId(params.senderId),
            senderEmail: params.senderEmail,
            senderRole: params.senderRole,
            message: params.message.trim(),
            isInternalNote: isInternal,
            createdAt: new Date()
        });
        ticket.lastRepliedAt = new Date();
        // If staff replies and status was OPEN, update to IN_PROGRESS
        if (params.senderRole === 'SUPER_ADMIN' && ticket.status === 'OPEN' && !isInternal) {
            ticket.status = 'IN_PROGRESS';
        }
        await ticket.save();
        logger_1.logger.info(`Reply added to ticket ${ticket.ticketNumber} by ${params.senderEmail} (internal: ${isInternal})`);
        return ticket;
    }
    /**
     * Update ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
     */
    async updateStatus(ticketId, status, adminEmail, adminId, reason) {
        const ticket = await SupportTicket_1.SupportTicketModel.findById(ticketId);
        if (!ticket) {
            throw apiError_1.ApiError.notFound('Ticket not found');
        }
        const prevStatus = ticket.status;
        ticket.status = status;
        const now = new Date();
        if (status === 'RESOLVED') {
            ticket.resolvedAt = now;
        }
        else if (status === 'CLOSED') {
            ticket.closedAt = now;
        }
        await ticket.save();
        await AuditLog_1.AuditLogModel.create({
            action: 'ADMIN_SETTING_CHANGE',
            adminId: new mongoose_1.default.Types.ObjectId(adminId),
            adminEmail,
            targetResourceId: ticket._id.toString(),
            resourceType: 'SUPPORT_TICKET',
            reason: reason || `Updated ticket status from ${prevStatus} to ${status}`,
            previousValue: { status: prevStatus },
            newValue: { status }
        }).catch(err => logger_1.logger.error('Audit log failed for ticket status change', err));
        return ticket;
    }
    /**
     * Assign ticket to an admin
     */
    async assignAdmin(ticketId, assignedAdminId, assigningAdminEmail) {
        const ticket = await SupportTicket_1.SupportTicketModel.findById(ticketId);
        if (!ticket) {
            throw apiError_1.ApiError.notFound('Ticket not found');
        }
        const admin = await User_1.UserModel.findById(assignedAdminId);
        if (!admin) {
            throw apiError_1.ApiError.notFound('Assigned admin not found');
        }
        ticket.assignedToAdminId = admin._id;
        ticket.assignedToAdminEmail = admin.email;
        await ticket.save();
        logger_1.logger.info(`Ticket ${ticket.ticketNumber} assigned to ${admin.email} by ${assigningAdminEmail}`);
        return ticket;
    }
}
exports.SupportTicketService = SupportTicketService;
exports.supportTicketService = new SupportTicketService();
//# sourceMappingURL=supportTicket.service.js.map