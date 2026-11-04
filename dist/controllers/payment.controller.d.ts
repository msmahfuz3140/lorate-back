import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare class PaymentController {
    /**
     * Create a new purchase order
     */
    createOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get single order status for the checkout screen
     */
    getOrder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * NOWPayments IPN Webhook Receiver
     * Processes server-to-server callback notifications
     */
    handleIpn(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Get supported crypto currencies
     */
    getCurrencies(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAdminOrders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getAdminSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    exportAdminReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const paymentController: PaymentController;
