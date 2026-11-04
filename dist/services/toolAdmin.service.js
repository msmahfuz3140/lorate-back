"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolAdminService = exports.ToolAdminService = void 0;
const ToolSettings_1 = require("../models/ToolSettings");
const Subscription_1 = require("../models/Subscription");
const prediction_service_1 = require("./prediction.service");
class ToolAdminService {
    /**
     * Get comprehensive tool telemetry, active live tables, strategies, and subscriber sessions
     */
    async getToolTelemetry() {
        const settings = await ToolSettings_1.ToolSettingsModel.getSettings();
        const liveTables = prediction_service_1.predictionService.getLobbyTables();
        const now = new Date();
        const [activeSubscribersCount, totalEligibleUsers] = await Promise.all([
            Subscription_1.SubscriptionModel.countDocuments({
                status: 'ACTIVE',
                isRevoked: { $ne: true },
                endDate: { $gt: now }
            }),
            Subscription_1.SubscriptionModel.distinct('userId', {
                status: 'ACTIVE',
                isRevoked: { $ne: true },
                endDate: { $gt: now }
            })
        ]);
        // Strategy distribution across live tables
        const strategyCounts = {
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
exports.ToolAdminService = ToolAdminService;
exports.toolAdminService = new ToolAdminService();
//# sourceMappingURL=toolAdmin.service.js.map