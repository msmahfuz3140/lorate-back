import { IToolSettings, ToolAccessPolicy } from '../models/ToolSettings';
export declare class ToolSettingsService {
    /**
     * Get public-facing tool operational status
     */
    getPublicToolStatus(): Promise<{
        isToolEnabled: boolean;
        maintenanceMode: boolean;
        publicStatusMessage: string;
        toolVersion: string;
        toolAccessPolicy: ToolAccessPolicy;
    }>;
    /**
     * Get full tool settings for Admin Panel
     */
    getAdminToolSettings(): Promise<IToolSettings>;
    /**
     * Update tool settings with mandatory audit trail
     */
    updateToolSettings(adminId: string, adminEmail: string, updates: {
        isToolEnabled?: boolean;
        maintenanceMode?: boolean;
        publicStatusMessage?: string;
        toolVersion?: string;
        toolAccessPolicy?: ToolAccessPolicy;
        premiumRequirements?: string;
    }, reason: string): Promise<IToolSettings>;
}
export declare const toolSettingsService: ToolSettingsService;
