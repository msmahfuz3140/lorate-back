"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimit = rateLimit;
const apiError_1 = require("../utils/apiError");
class MemoryRateLimiter {
    store = new Map();
    check(key, limit, windowMs) {
        const now = Date.now();
        const record = this.store.get(key);
        if (!record || now > record.resetAt) {
            this.store.set(key, { count: 1, resetAt: now + windowMs });
            return { allowed: true, retryAfterSeconds: 0 };
        }
        if (record.count >= limit) {
            const retryAfter = Math.ceil((record.resetAt - now) / 1000);
            return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) };
        }
        record.count += 1;
        return { allowed: true, retryAfterSeconds: 0 };
    }
    // Periodic cleanup
    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.store.entries()) {
            if (now > record.resetAt) {
                this.store.delete(key);
            }
        }
    }
}
const limiter = new MemoryRateLimiter();
setInterval(() => limiter.cleanup(), 60000);
function rateLimit(limit, windowMinutes, keyPrefix = 'rate') {
    const windowMs = windowMinutes * 60 * 1000;
    return (req, res, next) => {
        // Combine IP + body target (if any) to prevent distributed account brute-forcing
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const target = req.body?.target || req.body?.identifier || '';
        const key = `${keyPrefix}:${ip}:${target}`;
        const { allowed, retryAfterSeconds } = limiter.check(key, limit, windowMs);
        if (!allowed) {
            res.setHeader('Retry-After', retryAfterSeconds);
            next(apiError_1.ApiError.badRequest(`Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`, 'RATE_LIMIT_EXCEEDED'));
            return;
        }
        next();
    };
}
//# sourceMappingURL=rateLimit.middleware.js.map