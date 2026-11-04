"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const LEVEL_SEVERITY = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};
class Logger {
    currentLevel() {
        const configured = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
        return LEVEL_SEVERITY[configured] !== undefined ? LEVEL_SEVERITY[configured] : 1;
    }
    shouldLog(level) {
        return LEVEL_SEVERITY[level] >= this.currentLevel();
    }
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const logObject = {
            timestamp,
            level,
            message,
            ...(meta && Object.keys(meta).length > 0 ? { meta } : {})
        };
        return JSON.stringify(logObject);
    }
    info(message, meta) {
        if (this.shouldLog('INFO')) {
            console.log(this.formatMessage('INFO', message, meta));
        }
    }
    warn(message, meta) {
        if (this.shouldLog('WARN')) {
            console.warn(this.formatMessage('WARN', message, meta));
        }
    }
    error(message, error, meta) {
        if (this.shouldLog('ERROR')) {
            const errorDetails = error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : error;
            console.error(this.formatMessage('ERROR', message, {
                ...meta,
                error: errorDetails
            }));
        }
    }
    debug(message, meta) {
        if (this.shouldLog('DEBUG')) {
            console.debug(this.formatMessage('DEBUG', message, meta));
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map