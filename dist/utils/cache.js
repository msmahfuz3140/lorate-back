"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.memoryCache = void 0;
class MemoryCache {
    store = new Map();
    cleanupInterval = null;
    constructor() {
        // Periodic sweep every 60 seconds to prune expired items and keep RAM minimal
        this.cleanupInterval = setInterval(() => this.prune(), 60000);
        if (this.cleanupInterval && typeof this.cleanupInterval.unref === 'function') {
            this.cleanupInterval.unref();
        }
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return undefined;
        }
        return entry.value;
    }
    set(key, value, ttlSeconds = 30) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000
        });
    }
    async getOrSet(key, ttlSeconds, fetcher) {
        const cached = this.get(key);
        if (cached !== undefined) {
            return cached;
        }
        const fresh = await fetcher();
        this.set(key, fresh, ttlSeconds);
        return fresh;
    }
    del(key) {
        this.store.delete(key);
    }
    delByPrefix(prefix) {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }
    clear() {
        this.store.clear();
    }
    prune() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
            }
        }
    }
}
exports.memoryCache = new MemoryCache();
//# sourceMappingURL=cache.js.map