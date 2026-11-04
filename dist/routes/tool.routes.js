"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const subscriptionAccess_middleware_1 = require("../middleware/subscriptionAccess.middleware");
const router = (0, express_1.Router)();
/**
 * Validates that client has active server-side access to run the prediction tool.
 */
router.get('/session', auth_middleware_1.requireAuth, subscriptionAccess_middleware_1.requireActiveSubscription, (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            authorized: true,
            accessStatus: req.accessStatus,
            user: {
                id: req.user.id,
                name: req.user.name,
                role: req.user.role
            }
        }
    });
});
exports.toolRoutes = router;
//# sourceMappingURL=tool.routes.js.map