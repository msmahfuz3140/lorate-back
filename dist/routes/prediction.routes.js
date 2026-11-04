"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictionRoutes = void 0;
const express_1 = require("express");
const prediction_controller_1 = require("../controllers/prediction.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const subscriptionAccess_middleware_1 = require("../middleware/subscriptionAccess.middleware");
const router = (0, express_1.Router)();
// Public lobby tables
router.get('/lobby', (req, res) => prediction_controller_1.predictionController.getLobby(req, res));
// Table analysis (protected endpoint, requires active server-validated subscription)
router.get('/table/:tableId', auth_middleware_1.requireAuth, subscriptionAccess_middleware_1.requireActiveSubscription, (req, res) => prediction_controller_1.predictionController.getTableAnalysis(req, res));
exports.predictionRoutes = router;
//# sourceMappingURL=prediction.routes.js.map