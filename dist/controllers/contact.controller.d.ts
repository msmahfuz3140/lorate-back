import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
export declare const ContactSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    subject: z.ZodString;
    message: z.ZodString;
}, z.core.$strip>;
export declare class ContactController {
    submitInquiry(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const contactController: ContactController;
