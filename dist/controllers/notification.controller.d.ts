import { Request, Response, NextFunction } from 'express';
export declare class NotificationController {
    /**
     * GET /api/v1/notifications
     */
    getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/notifications/:id/read
     */
    markAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/notifications/read-all
     */
    markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const notificationController: NotificationController;
