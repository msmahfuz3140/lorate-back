"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.requireAuth);
router.get('/', (req, res, next) => notification_controller_1.notificationController.getUserNotifications(req, res, next));
router.patch('/:id/read', (req, res, next) => notification_controller_1.notificationController.markAsRead(req, res, next));
router.post('/read-all', (req, res, next) => notification_controller_1.notificationController.markAllAsRead(req, res, next));
exports.notificationRoutes = router;
//# sourceMappingURL=notification.routes.js.map