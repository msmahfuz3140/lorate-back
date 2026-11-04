"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const connection_1 = require("./database/connection");
const initAdmin_1 = require("./database/initAdmin");
const logger_1 = require("./utils/logger");
async function bootstrap() {
    logger_1.logger.info('Starting Roulette Platform API server...', {
        environment: env_1.env.NODE_ENV,
        port: env_1.env.PORT
    });
    // Connect to Database
    await connection_1.db.connect();
    // Ensure authoritative SUPER_ADMIN exists in MongoDB and old demo accounts are removed
    await (0, initAdmin_1.initializeAuthoritativeAdmin)().catch((err) => {
        logger_1.logger.error('Warning: could not complete admin initialization', err);
    });
    const server = app_1.app.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Server is up and listening on port ${env_1.env.PORT}`, {
            apiUrl: `http://localhost:${env_1.env.PORT}/api/v1`,
            healthUrl: `http://localhost:${env_1.env.PORT}/health`
        });
    });
    // Graceful shutdown handling
    const handleShutdown = async (signal) => {
        logger_1.logger.info(`Received ${signal}. Initiating graceful shutdown...`);
        server.close(async () => {
            logger_1.logger.info('HTTP server closed');
            await connection_1.db.disconnect();
            process.exit(0);
        });
        // Force shutdown after 10 seconds if still hanging
        setTimeout(() => {
            logger_1.logger.error('Forced shutdown due to timeout');
            process.exit(1);
        }, 10000);
    };
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
}
bootstrap().catch((err) => {
    logger_1.logger.error('Fatal error during application bootstrap', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map