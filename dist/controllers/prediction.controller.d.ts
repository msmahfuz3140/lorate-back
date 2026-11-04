import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
export declare class PredictionController {
    getLobby(req: Request, res: Response): void;
    getTableAnalysis(req: AuthenticatedRequest, res: Response): void;
}
export declare const predictionController: PredictionController;
