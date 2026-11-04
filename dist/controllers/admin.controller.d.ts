import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare class AdminController {
    getDashboardMetrics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getUserDetails(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    updateUserProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    changeUserStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    softDeleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    getAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    listDualApprovals(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    requestDualApproval(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    approveDualApproval(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    rejectDualApproval(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
    createStaffUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const adminController: AdminController;
