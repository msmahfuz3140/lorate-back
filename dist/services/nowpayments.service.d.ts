export interface CreateNowPaymentsInvoiceInput {
    priceAmount: number;
    priceCurrency: string;
    payCurrency?: string;
    orderId: string;
    orderDescription: string;
    ipnCallbackUrl: string;
    successUrl: string;
    cancelUrl: string;
}
export interface CreateNowPaymentsPaymentInput {
    priceAmount: number;
    priceCurrency: string;
    payAmount?: number;
    payCurrency: string;
    ipnCallbackUrl: string;
    orderId: string;
    orderDescription: string;
}
export declare class NowPaymentsService {
    private baseUrl;
    /**
     * Recursively sorts all keys in an object alphabetically.
     * This is required by the official NOWPayments IPN signature algorithm.
     */
    sortObjectKeys(obj: any): any;
    /**
     * Verifies the x-nowpayments-sig HMAC-SHA512 signature against the incoming payload.
     * Uses timing-safe equality to prevent timing attacks.
     */
    verifyIpnSignature(payload: any, signature: string | undefined, customSecret?: string): boolean;
    /**
     * Helper to generate a valid signature for automated testing / simulation.
     */
    generateIpnSignature(payload: any, secret: string): string;
    /**
     * Check NOWPayments API operational status (GET /v1/status)
     */
    getStatus(): Promise<{
        message: string;
    }>;
    /**
     * Get supported currencies list (GET /v1/currencies)
     */
    getCurrencies(): Promise<string[]>;
    /**
     * Create an invoice with hosted checkout link (POST /v1/invoice)
     */
    createInvoice(input: CreateNowPaymentsInvoiceInput): Promise<any>;
    /**
     * Create direct payment with wallet address (POST /v1/payment)
     */
    createPayment(input: CreateNowPaymentsPaymentInput): Promise<any>;
    /**
     * Get payment details and live status (GET /v1/payment/{id})
     */
    getPayment(paymentId: string): Promise<any>;
}
export declare const nowPaymentsService: NowPaymentsService;
