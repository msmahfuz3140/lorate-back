import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { ZodError } from 'zod';
export declare function errorHandler(err: Error | ApiError | ZodError, req: Request, res: Response, next: NextFunction): void;
