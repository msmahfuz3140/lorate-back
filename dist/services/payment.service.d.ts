import { IPayment } from '../models/Payment';
import { PaymentStatus, NowPaymentsIpnPayload, AdminPaymentFilterInput, AdminPaymentSummary } from '../shared/subscriptions';
export interface CreateOrderResult {
    orderId: string;
    paymentId: string;
    planId: string;
    planName: string;
    priceUsd: number;
    priceCents: number;
    status: PaymentStatus;
    checkoutUrl: string;
    payAddress?: string;
    payAmount?: number;
    payCurrency: string;
    createdAt: string;
}
export interface ProcessIpnResult {
    success: boolean;
    orderId?: string;
    paymentId?: string;
    status: PaymentStatus;
    isFulfilled: boolean;
    duplicate?: boolean;
    subscriptionId?: string;
    message: string;
}
export declare class PaymentService {
    /**
     * Create a purchase order and initialize a NOWPayments invoice
     */
    createPurchaseOrder(userId: string, planId: string, payCurrency?: string): Promise<CreateOrderResult>;
    /**
     * Process and verify NOWPayments IPN webhook callbacks
     */
    processIpnCallback(payload: NowPaymentsIpnPayload, signature: string | undefined, customSecret?: string): Promise<ProcessIpnResult>;
    /**
     * Get single order by orderId
     */
    getOrder(orderId: string, userId: string, isSuperAdmin: boolean): Promise<IPayment>;
    /**
     * Admin Payment Management: View, search, and filter orders
     */
    getAdminOrders(filter: AdminPaymentFilterInput): Promise<{
        orders: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * Admin Payment Management: High-level financial summary
     */
    getAdminSummary(): Promise<AdminPaymentSummary>;
    /**
     * Admin Payment Management: Export reconciliation report (JSON + CSV structure)
     */
    exportAdminReport(startDate?: string, endDate?: string): Promise<{
        csv: string;
        count: number;
        totalGrossUsd: number;
    }>;
}
export declare const paymentService: PaymentService;
