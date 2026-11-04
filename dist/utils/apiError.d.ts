export declare class ApiError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code?: string;
    readonly details?: unknown;
    constructor(statusCode: number, message: string, code?: string, details?: unknown);
    static badRequest(message: string, code?: string, details?: unknown): ApiError;
    static unauthorized(message?: string, code?: string): ApiError;
    static forbidden(message?: string, code?: string): ApiError;
    static notFound(message?: string, code?: string): ApiError;
    static conflict(message: string, code?: string): ApiError;
    static internal(message?: string, code?: string): ApiError;
}
