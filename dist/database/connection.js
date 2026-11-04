"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class Database {
    isConnecting = false;
    memoryServer;
    async connect() {
        if (mongoose_1.default.connection.readyState === 1) {
            return true;
        }
        if (this.isConnecting) {
            return false;
        }
        this.isConnecting = true;
        try {
            mongoose_1.default.connection.on('connected', () => {
                logger_1.logger.info('MongoDB connected successfully', { host: mongoose_1.default.connection.host });
            });
            mongoose_1.default.connection.on('error', (err) => {
                logger_1.logger.error('MongoDB connection error', err);
            });
            mongoose_1.default.connection.on('disconnected', () => {
                logger_1.logger.warn('MongoDB disconnected');
            });
            mongoose_1.default.connection.on('reconnected', () => {
                logger_1.logger.info('MongoDB reconnected');
            });
            await mongoose_1.default.connect(env_1.env.MONGODB_URI, {
                serverSelectionTimeoutMS: env_1.env.NODE_ENV === 'production' ? 10000 : 3000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                maxPoolSize: 50,
                minPoolSize: env_1.env.NODE_ENV === 'production' ? 5 : 1,
                autoIndex: env_1.env.NODE_ENV !== 'production'
            });
            this.isConnecting = false;
            return true;
        }
        catch (error) {
            if (env_1.env.NODE_ENV === 'development') {
                try {
                    // If a local or embedded engine is already running on 27017, connect directly
                    await mongoose_1.default.connect('mongodb://127.0.0.1:27017/roulette-platform', {
                        serverSelectionTimeoutMS: 2000
                    });
                    logger_1.logger.info('Connected to active local MongoDB engine on 127.0.0.1:27017');
                    this.isConnecting = false;
                    return true;
                }
                catch {
                    // Continue to spawn embedded engine
                }
                logger_1.logger.warn('Standalone MongoDB not detected. Initializing embedded development engine (persisted in .dev-db)...');
                try {
                    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                    const path = await Promise.resolve().then(() => __importStar(require('path')));
                    const { MongoMemoryServer } = await Promise.resolve().then(() => __importStar(require('mongodb-memory-server')));
                    const dbDir = path.resolve(process.cwd(), '.dev-db');
                    if (!fs.existsSync(dbDir)) {
                        fs.mkdirSync(dbDir, { recursive: true });
                    }
                    this.memoryServer = await MongoMemoryServer.create({
                        instance: {
                            port: 27017,
                            dbPath: dbDir,
                            dbName: 'roulette-platform'
                        }
                    });
                    const uri = this.memoryServer.getUri('roulette-platform');
                    await mongoose_1.default.connect(uri);
                    logger_1.logger.info(`Development database engine is active and ready: ${uri}`);
                    this.isConnecting = false;
                    return true;
                }
                catch (memErr) {
                    logger_1.logger.error('Failed to initialize development MongoMemoryServer fallback', memErr);
                }
            }
            this.isConnecting = false;
            logger_1.logger.error('Failed to connect to MongoDB initially. Will retry in background or on first request.', error);
            return false;
        }
    }
    async disconnect() {
        if (mongoose_1.default.connection.readyState !== 0) {
            await mongoose_1.default.disconnect();
            logger_1.logger.info('MongoDB connection closed gracefully');
        }
        if (this.memoryServer) {
            await this.memoryServer.stop();
            logger_1.logger.info('Embedded development MongoMemoryServer stopped');
        }
    }
    getHealth() {
        const readyState = mongoose_1.default.connection.readyState;
        const isConnected = readyState === 1;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        return {
            status: states[readyState] || 'unknown',
            readyState,
            isConnected,
            host: mongoose_1.default.connection.host || undefined,
            dbName: mongoose_1.default.connection.name || undefined
        };
    }
}
exports.db = new Database();
//# sourceMappingURL=connection.js.map