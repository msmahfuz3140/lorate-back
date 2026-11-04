declare class Database {
    private isConnecting;
    private memoryServer?;
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    getHealth(): {
        status: string;
        readyState: number;
        isConnected: boolean;
        host?: string;
        dbName?: string;
    };
}
export declare const db: Database;
export {};
