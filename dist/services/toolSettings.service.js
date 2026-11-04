"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolSettingsService = exports.ToolSettingsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ToolSettings_1 = require("../models/ToolSettings");
const User_1 = require("../models/User");
const AuditLog_1 = require("../models/AuditLog");
const apiError_1 = require("../utils/apiError");
const roles_1 = require("../shared/roles");
const logger_1 = require("../utils/logger");
class ToolSettingsService {
    /**
     * Get public-facing tool operational status
     */
    async getPublicToolStatus() {
        const settings = await ToolSettings_1.ToolSettingsModel.getSettings();
        return {
            isToolEnabled: settings.isToolEnabled,
            maintenanceMode: settings.maintenanceMode,
            publicStatusMessage: settings.publicStatusMessage,
            toolVersion: settings.toolVersion,
            toolAccessPolicy: settings.toolAccessPolicy
        };
    }
    /**
     * Get full tool settings for Admin Panel
     */
    async getAdminToolSettings() {
        return ToolSettings_1.ToolSettingsModel.getSettings();
    }
    /**
     * Update tool settings with mandatory audit trail
     */
    async updateToolSettings(adminId, adminEmail, updates, reason) {
        if (!reason || reason.trim() === '') {
            throw apiError_1.ApiError.badRequest('Audit reason is strictly required when modifying tool operational settings');
        }
        const admin = await User_1.UserModel.findById(adminId);
        if (!admin || admin.role !== roles_1.UserRole.SUPER_ADMIN) {
            throw apiError_1.ApiError.forbidden('Only authorized Main Admins can change tool operational settings');
        }
        const settings = await ToolSettings_1.ToolSettingsModel.getSettings();
        const previousSnapshot = {
            isToolEnabled: settings.isToolEnabled,
            maintenanceMode: settings.maintenanceMode,
            publicStatusMessage: settings.publicStatusMessage,
            toolVersion: settings.toolVersion,
            toolAccessPolicy: settings.toolAccessPolicy,
            premiumRequirements: settings.premiumRequirements
        };
        if (updates.isToolEnabled !== undefined) {
            settings.isToolEnabled = Boolean(updates.isToolEnabled);
        }
        if (updates.maintenanceMode !== undefined) {
            settings.maintenanceMode = Boolean(updates.maintenanceMode);
        }
        if (updates.publicStatusMessage !== undefined) {
            settings.publicStatusMessage = updates.publicStatusMessage.trim();
        }
        if (updates.toolVersion !== undefined) {
            settings.toolVersion = updates.toolVersion.trim();
        }
        if (updates.toolAccessPolicy !== undefined) {
            settings.toolAccessPolicy = updates.toolAccessPolicy;
        }
        if (updates.premiumRequirements !== undefined) {
            settings.premiumRequirements = updates.premiumRequirements.trim();
        }
        settings.updatedByAdminId = new mongoose_1.default.Types.ObjectId(adminId);
        settings.updatedByAdminEmail = adminEmail;
        await settings.save();
        await AuditLog_1.AuditLogModel.create({
            action: 'TOOL_SETTINGS_UPDATE',
            adminId: new mongoose_1.default.Types.ObjectId(adminId),
            adminEmail,
            reason: reason.trim(),
            previousValue: previousSnapshot,
            newValue: {
                isToolEnabled: settings.isToolEnabled,
                maintenanceMode: settings.maintenanceMode,
                publicStatusMessage: settings.publicStatusMessage,
                toolVersion: settings.toolVersion,
                toolAccessPolicy: settings.toolAccessPolicy,
                premiumRequirements: settings.premiumRequirements
            },
            details: {
                note: 'Operational status updated. Authentication and subscriber records remain strictly intact.'
            }
        });
        logger_1.logger.info(`Main Admin ${adminEmail} updated tool settings. Enabled: ${settings.isToolEnabled}, Maintenance: ${settings.maintenanceMode}. Reason: ${reason}`);
        return settings;
    }
}
exports.ToolSettingsService = ToolSettingsService;
exports.toolSettingsService = new ToolSettingsService();
//# sourceMappingURL=toolSettings.service.js.map