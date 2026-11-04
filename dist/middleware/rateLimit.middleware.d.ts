import { Request, Response, NextFunction } from 'express';
export declare function rateLimit(limit: number, windowMinutes: number, keyPrefix?: string): (req: Request, res: Response, next: NextFunction) => void;
