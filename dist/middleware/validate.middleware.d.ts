import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';
export declare function validate(schema: ZodTypeAny): (req: Request, res: Response, next: NextFunction) => Promise<void>;
