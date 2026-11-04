import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { AccessStatusResponse } from '../shared/subscriptions';
export interface ProtectedToolRequest extends AuthenticatedRequest {
    accessStatus?: AccessStatusResponse;
}
/**
 * Express middleware enforcing server-side subscription validation.
 * Checks authentication, database validity, start date, end date, and revocation status.
 */
export declare function requireActiveSubscription(req: ProtectedToolRequest, res: Response, next: NextFunction): Promise<void>;
