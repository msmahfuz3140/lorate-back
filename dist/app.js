"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const routes_1 = require("./routes");
const error_middleware_1 = require("./middleware/error.middleware");
const health_controller_1 = require("./controllers/health.controller");
const logger_1 = require("./utils/logger");
exports.app = (0, express_1.default)();
// Security & Parsing Middlewares
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowed = env_1.env.CORS_ORIGIN.split(',').map(o => o.trim());
        if (allowed.includes(origin) || env_1.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    },
    credentials: true
}));
exports.app.use(express_1.default.json({
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    }
}));
exports.app.use(express_1.default.urlencoded({ extended: true }));
// Request logging middleware
exports.app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.logger.debug(`${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`, {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip
        });
    });
    next();
});
// Root health check endpoint
exports.app.get('/health', health_controller_1.getHealth);
// Better Auth endpoints
let betterAuthHandler = null;
exports.app.all(['/api/auth/*', '/api/v1/auth/better/*'], (req, res, next) => {
    try {
        if (!betterAuthHandler) {
            const { toNodeHandler } = require('better-auth/node');
            const { getBetterAuth } = require('./auth/better-auth');
            betterAuthHandler = toNodeHandler(getBetterAuth());
        }
        return betterAuthHandler(req, res);
    }
    catch (err) {
        next(err);
    }
});
// API v1 prefix
exports.app.use('/api/v1', routes_1.apiRoutes);
// 404 handler
exports.app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'ROUTE_NOT_FOUND',
            message: `The requested endpoint ${req.method} ${req.originalUrl} was not found on this server.`
        }
    });
});
// Global Centralized Error Handler
exports.app.use(error_middleware_1.errorHandler);
//# sourceMappingURL=app.js.map