export interface AiQueryResult {
    answer: string;
    category: 'SALES' | 'PLANS' | 'EXPIRY' | 'MODERATORS' | 'PAYMENTS' | 'SECURITY' | 'FINANCIAL' | 'GENERAL';
    dataSummary: Record<string, any>;
    isReadOnlyEnforced: boolean;
    generatedAt: string;
}
export declare class AiAssistantService {
    /**
     * Process read-only natural language business inquiries for Main Admins
     */
    processQuery(queryText: string): Promise<AiQueryResult>;
}
export declare const aiAssistantService: AiAssistantService;
