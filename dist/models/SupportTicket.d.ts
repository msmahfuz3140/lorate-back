import mongoose, { Document } from 'mongoose';
export type TicketCategory = 'BILLING' | 'TOOL_ACCESS' | 'ACCOUNT' | 'OTHER';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export interface ITicketMessage {
    _id?: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    senderEmail: string;
    senderRole: string;
    message: string;
    isInternalNote: boolean;
    createdAt: Date;
}
export interface ISupportTicket extends Document {
    ticketNumber: string;
    userId: mongoose.Types.ObjectId;
    userName: string;
    userEmail: string;
    subject: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    status: TicketStatus;
    assignedToAdminId?: mongoose.Types.ObjectId;
    assignedToAdminEmail?: string;
    relatedPaymentId?: mongoose.Types.ObjectId;
    relatedSubscriptionId?: mongoose.Types.ObjectId;
    messages: ITicketMessage[];
    lastRepliedAt?: Date;
    resolvedAt?: Date;
    closedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare const SupportTicketModel: mongoose.Model<ISupportTicket, {}, {}, {}, mongoose.Document<unknown, {}, ISupportTicket, {}, {}> & ISupportTicket & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
