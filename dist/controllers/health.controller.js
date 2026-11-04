"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = getHealth;
const connection_1 = require("../database/connection");
function getHealth(req, res) {
    const dbHealth = connection_1.db.getHealth();
    const isHealthy = dbHealth.isConnected || process.env.NODE_ENV !== 'production';
    res.status(isHealthy ? 200 : 503).json({
        success: true,
        data: {
            status: 'UP',
            timestamp: new Date().toISOString(),
            uptimeSeconds: Math.floor(process.uptime()),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            database: dbHealth
        }
    });
}
//# sourceMappingURL=health.controller.js.map