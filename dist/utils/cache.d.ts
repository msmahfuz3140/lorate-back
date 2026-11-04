declare class MemoryCache {
    private store;
    private cleanupInterval;
    constructor();
    get<T>(key: string): T | undefined;
    set<T>(key: string, value: T, ttlSeconds?: number): void;
    getOrSet<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T>;
    del(key: string): void;
    delByPrefix(prefix: string): void;
    clear(): void;
    private prune;
}
export declare const memoryCache: MemoryCache;
export {};
