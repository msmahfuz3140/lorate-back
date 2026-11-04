import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare class AdminExtendedController {
    getTickets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getTicketDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    replyTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    updateTicketStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    assignTicket(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getSecurityOverview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getSecurityAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    revokeUserSessions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getToolTelemetry(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    queryAiAssistant(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getNotificationMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    sendTargetedNotification(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const adminExtendedController: AdminExtendedController;
