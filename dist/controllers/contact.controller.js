"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactController = exports.ContactController = exports.ContactSchema = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
exports.ContactSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
    email: zod_1.z.string().email('Please provide a valid email address'),
    subject: zod_1.z.string().min(3, 'Subject must be at least 3 characters long'),
    message: zod_1.z.string().min(10, 'Message must be at least 10 characters long')
});
class ContactController {
    async submitInquiry(req, res, next) {
        try {
            const validated = exports.ContactSchema.parse(req.body);
            logger_1.logger.info('Support inquiry received', {
                name: validated.name,
                email: validated.email,
                subject: validated.subject,
                ip: req.ip
            });
            res.status(200).json({
                success: true,
                message: 'Your inquiry has been received. Our support team will review your message and reply via email within 24 hours.'
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ContactController = ContactController;
exports.contactController = new ContactController();
//# sourceMappingURL=contact.controller.js.map