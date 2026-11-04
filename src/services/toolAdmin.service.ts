import { ToolSettingsModel, IToolSettings } from '../models/ToolSettings';
import { SubscriptionModel } from '../models/Subscription';
import { predictionService } from './prediction.service';
import { logger } from '../utils/logger';

export class ToolAdminService {
  /**
   * Get comprehensive tool telemetry, active live tables, strategies, and subscriber sessions
   */
  async getToolTelemetry(): Promise<any> {
    const settings = await ToolSettingsModel.getSettings();
    const liveTables = predictionService.getLobbyTables();
    const now = new Date();

    const [activeSubscribersCount, totalEligibleUsers] = await Promise.all([
      SubscriptionModel.countDocuments({
        status: 'ACTIVE',
        isRevoked: { $ne: true },
        endDate: { $gt: now }
      }),
      SubscriptionModel.distinct('userId', {
        status: 'ACTIVE',
        isRevoked: { $ne: true },
        endDate: { $gt: now }
      })
    ]);

    // Strategy distribution across live tables
    const strategyCounts: Record<string, number> = {
      OFFSET: 0,
      TARGET: 0,
      DEALER_SIGNATURE: 0
    };

    for (const table of liveTables) {
      if (strategyCounts[table.activeStrategy] !== undefined) {
        strategyCounts[table.activeStrategy]++;
      }
    }

    return {
      settings: {
        isToolEnabled: settings.isToolEnabled,
        maintenanceMode: settings.maintenanceMode,
        publicStatusMessage: settings.publicStatusMessage,
        toolVersion: settings.toolVersion,
        toolAccessPolicy: settings.toolAccessPolicy,
        premiumRequirements: settings.premiumRequirements,
        updatedAt: settings.updatedAt
      },
      liveTablesCount: liveTables.length,
      activeSubscribersWithAccess: activeSubscribersCount,
      uniqueUsersWithAccess: totalEligibleUsers.length,
      strategyDistribution: strategyCounts,
      tables: liveTables,
      telemetryNotice: {
        disclaimer: 'The Roulette Prediction Suite executes algorithmic statistical modeling (Offset, Target Sequences, and Dealer Signature rhythms) based on verified physical wheel physics. In strict compliance with regulatory governance, no outcome is guaranteed, and no simulator or fabricated win-rate is used.'
      }
    };
  }
}

export const toolAdminService = new ToolAdminService();
