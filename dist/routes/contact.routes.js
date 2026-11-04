"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.contactRoutes = void 0;
const express_1 = require("express");
const contact_controller_1 = require("../controllers/contact.controller");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const router = (0, express_1.Router)();
// Rate limit: 5 inquiries per 15 minutes per IP
router.post('/', (0, rateLimit_middleware_1.rateLimit)(5, 15, 'contact'), (req, res, next) => contact_controller_1.contactController.submitInquiry(req, res, next));
exports.contactRoutes = router;
//# sourceMappingURL=contact.routes.js.map