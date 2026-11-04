"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderatorRoutes = void 0;
const express_1 = require("express");
const moderator_controller_1 = require("../controllers/moderator.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const roles_1 = require("../shared/roles");
const router = (0, express_1.Router)();
// Strictly enforce MODERATOR role authorization
router.use(auth_middleware_1.requireAuth);
router.use((0, auth_middleware_1.requireRole)(roles_1.UserRole.MODERATOR));
router.get('/dashboard', (req, res, next) => moderator_controller_1.moderatorController.getModeratorSelfDashboard(req, res, next));
router.get('/commissions', (req, res, next) => moderator_controller_1.moderatorController.getModeratorSelfCommissions(req, res, next));
router.get('/referred-users', (req, res, next) => moderator_controller_1.moderatorController.getModeratorSelfReferredUsers(req, res, next));
exports.moderatorRoutes = router;
//# sourceMappingURL=moderator.routes.js.map