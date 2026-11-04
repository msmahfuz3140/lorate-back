import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../shared/roles';
import { AuthUser } from '../shared/auth';
export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}
export declare function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
export declare function requireRole(...allowedRoles: UserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare function requirePremiumSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
