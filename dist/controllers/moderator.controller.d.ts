import { Request, Response, NextFunction } from 'express';
export declare class ModeratorController {
    /**
     * POST /api/v1/admin/moderators
     */
    createModerator(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/moderators
     */
    listModerators(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/moderators/:moderatorId
     */
    getModeratorDetails(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/admin/moderators/:moderatorId/status
     */
    updateModeratorStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/admin/moderators/:moderatorId/reset-password
     */
    resetModeratorPassword(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/admin/moderators/:moderatorId/commission-rate
     */
    updateModeratorCommissionRate(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/referrals/overview
     */
    getReferralOverview(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/referrals/commissions
     */
    listCommissions(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/admin/referrals/commissions/:commissionId/status
     */
    updateCommissionStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/admin/referrals/commissions/:commissionId/adjust
     */
    adjustCommission(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/referrals/export
     */
    exportCommissionsCsv(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/referrals/policy
     */
    getCommissionPolicy(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/admin/referrals/policy
     */
    updateGlobalCommissionPolicy(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/referrals/fraud-alerts
     */
    getFraudAlerts(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/moderator/dashboard
     */
    getModeratorSelfDashboard(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/moderator/commissions
     */
    getModeratorSelfCommissions(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/moderator/referred-users
     */
    getModeratorSelfReferredUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const moderatorController: ModeratorController;
