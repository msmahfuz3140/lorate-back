import { ISupportTicket, TicketCategory, TicketPriority, TicketStatus } from '../models/SupportTicket';
export interface TicketListFilter {
    status?: string;
    priority?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class SupportTicketService {
    /**
     * Create a new support ticket (User or Admin initiated)
     */
    createTicket(params: {
        userId: string;
        subject: string;
        description: string;
        category?: TicketCategory;
        priority?: TicketPriority;
        relatedPaymentId?: string;
        relatedSubscriptionId?: string;
    }): Promise<ISupportTicket>;
    /**
     * List tickets with pagination, filters, and full text search
     */
    getTickets(filter: TicketListFilter): Promise<{
        tickets: ISupportTicket[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Get single ticket by ID
     */
    getTicketById(ticketId: string): Promise<ISupportTicket>;
    /**
     * Add a reply or internal note to a ticket
     */
    addReply(params: {
        ticketId: string;
        senderId: string;
        senderEmail: string;
        senderRole: string;
        message: string;
        isInternalNote?: boolean;
    }): Promise<ISupportTicket>;
    /**
     * Update ticket status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
     */
    updateStatus(ticketId: string, status: TicketStatus, adminEmail: string, adminId: string, reason?: string): Promise<ISupportTicket>;
    /**
     * Assign ticket to an admin
     */
    assignAdmin(ticketId: string, assignedAdminId: string, assigningAdminEmail: string): Promise<ISupportTicket>;
}
export declare const supportTicketService: SupportTicketService;
