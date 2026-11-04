"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const apiError_1 = require("../utils/apiError");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
next) {
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: (err.issues || err.errors || []).map((e) => ({
                    field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
                    message: e.message
                }))
            }
        });
        return;
    }
    // Handle custom ApiError
    if (err instanceof apiError_1.ApiError) {
        res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code || 'API_ERROR',
                message: err.message,
                details: err.details
            }
        });
        return;
    }
    // Handle unexpected internal errors
    logger_1.logger.error('Unhandled Server Error', err, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip
    });
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred. Please try again later.'
                : err.message
        }
    });
}
//# sourceMappingURL=error.middleware.js.map