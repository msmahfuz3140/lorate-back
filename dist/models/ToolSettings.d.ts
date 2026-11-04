import mongoose, { Document } from 'mongoose';
export type ToolAccessPolicy = 'PREMIUM_ONLY' | 'OPEN_BETA' | 'MAINTENANCE';
export interface IToolSettings extends Document {
    isToolEnabled: boolean;
    maintenanceMode: boolean;
    publicStatusMessage: string;
    toolVersion: string;
    toolAccessPolicy: ToolAccessPolicy;
    premiumRequirements: string;
    updatedByAdminId?: mongoose.Types.ObjectId;
    updatedByAdminEmail?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IToolSettingsModel extends mongoose.Model<IToolSettings> {
    getSettings(): Promise<IToolSettings>;
}
export declare const ToolSettingsModel: IToolSettingsModel;
