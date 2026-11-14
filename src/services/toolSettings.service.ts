import mongoose from 'mongoose';
import { ToolSettingsModel, IToolSettings, ToolAccessPolicy } from '../models/ToolSettings';
import { UserModel } from '../models/User';
import { AuditLogModel } from '../models/AuditLog';
import { ApiError } from '../utils/apiError';
import { UserRole } from '../shared/roles';
import { logger } from '../utils/logger';

export class ToolSettingsService {
  /**
   * Get public-facing tool operational status
   */
  async getPublicToolStatus(): Promise<{
    isToolEnabled: boolean;
    maintenanceMode: boolean;
    publicStatusMessage: string;
    toolVersion: string;
    toolAccessPolicy: ToolAccessPolicy;
    dsApiConfigured: boolean;
  }> {
    const settings = await ToolSettingsModel.getSettings();
    return {
      isToolEnabled: settings.isToolEnabled,
      maintenanceMode: settings.maintenanceMode,
      publicStatusMessage: settings.publicStatusMessage,
      toolVersion: settings.toolVersion,
      toolAccessPolicy: settings.toolAccessPolicy,
      dsApiConfigured: !!(settings.dsApiKey && settings.dsApiUrl)
    };
  }

  /**
   * Get full tool settings for Admin Panel
   */
  async getAdminToolSettings(): Promise<IToolSettings> {
    return ToolSettingsModel.getSettings();
  }

  /**
   * Get DS API credentials for internal proxy use only
   */
  async getDsApiCredentials(): Promise<{ dsApiKey: string; dsApiUrl: string }> {
    const settings = await ToolSettingsModel.getSettings();
    return {
      dsApiKey: settings.dsApiKey || '',
      dsApiUrl: settings.dsApiUrl || ''
    };
  }

  /**
   * Update tool settings with mandatory audit trail
   */
  async updateToolSettings(
    adminId: string,
    adminEmail: string,
    updates: {
      isToolEnabled?: boolean;
      maintenanceMode?: boolean;
      publicStatusMessage?: string;
      toolVersion?: string;
      toolAccessPolicy?: ToolAccessPolicy;
      premiumRequirements?: string;
      dsApiKey?: string;
      dsApiUrl?: string;
    },
    reason: string
  ): Promise<IToolSettings> {
    if (!reason || reason.trim() === '') {
      throw ApiError.badRequest('Audit reason is strictly required when modifying tool operational settings');
    }

    const admin = await UserModel.findById(adminId);
    if (!admin || admin.role !== UserRole.SUPER_ADMIN) {
      throw ApiError.forbidden('Only authorized Main Admins can change tool operational settings');
    }

    const settings = await ToolSettingsModel.getSettings();
    const previousSnapshot = {
      isToolEnabled: settings.isToolEnabled,
      maintenanceMode: settings.maintenanceMode,
      publicStatusMessage: settings.publicStatusMessage,
      toolVersion: settings.toolVersion,
      toolAccessPolicy: settings.toolAccessPolicy,
      premiumRequirements: settings.premiumRequirements,
      dsApiKey: settings.dsApiKey ? '***MASKED***' : '',
      dsApiUrl: settings.dsApiUrl
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
    if (updates.dsApiKey !== undefined) {
      settings.dsApiKey = updates.dsApiKey.trim();
    }
    if (updates.dsApiUrl !== undefined) {
      settings.dsApiUrl = updates.dsApiUrl.trim().replace(/\/+$/, '');
    }

    settings.updatedByAdminId = new mongoose.Types.ObjectId(adminId);
    settings.updatedByAdminEmail = adminEmail;
    await settings.save();

    await AuditLogModel.create({
      action: 'TOOL_SETTINGS_UPDATE',
      adminId: new mongoose.Types.ObjectId(adminId),
      adminEmail,
      reason: reason.trim(),
      previousValue: previousSnapshot,
      newValue: {
        isToolEnabled: settings.isToolEnabled,
        maintenanceMode: settings.maintenanceMode,
        publicStatusMessage: settings.publicStatusMessage,
        toolVersion: settings.toolVersion,
        toolAccessPolicy: settings.toolAccessPolicy,
        premiumRequirements: settings.premiumRequirements,
        dsApiKey: settings.dsApiKey ? '***MASKED***' : '',
        dsApiUrl: settings.dsApiUrl
      },
      details: {
        note: 'Operational status updated. Authentication and subscriber records remain strictly intact.'
      }
    });

    logger.info(`Main Admin ${adminEmail} updated tool settings. Enabled: ${settings.isToolEnabled}, Maintenance: ${settings.maintenanceMode}. Reason: ${reason}`);

    return settings;
  }
}

export const toolSettingsService = new ToolSettingsService();
