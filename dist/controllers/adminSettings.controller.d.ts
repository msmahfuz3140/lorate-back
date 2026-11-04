import { Request, Response, NextFunction } from 'express';
export declare class AdminSettingsController {
    /**
     * GET /api/v1/tool/status
     */
    getPublicToolStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/tool/settings
     */
    getAdminToolSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/admin/tool/settings
     */
    updateToolSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/settings/public
     */
    getPublicWebsiteSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/settings
     */
    getAdminWebsiteSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PUT /api/v1/admin/settings
     */
    updateWebsiteSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/plans
     */
    getAdminPlans(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/admin/plans
     */
    createAdminPlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * PATCH /api/v1/admin/plans/:planId
     */
    updateAdminPlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * DELETE /api/v1/admin/plans/:planId
     */
    deleteAdminPlan(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/reports/summary
     */
    getReportsSummary(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/v1/admin/reports/export
     */
    exportReportCsv(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/v1/admin/notifications/broadcast
     */
    broadcastAnnouncement(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const adminSettingsController: AdminSettingsController;
