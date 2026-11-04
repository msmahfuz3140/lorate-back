import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare class SubscriptionController {
    listAllSubscriptions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getPlans(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAllPlans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    createPlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    updatePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    deletePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getMySubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    /**
     * Real-time server-side subscription validation check
     */
    getAccessStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    grantManual(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    extend(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    revoke(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    unlockTool(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    approveSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    manuallyUnlockSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const subscriptionController: SubscriptionController;
