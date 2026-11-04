"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictionController = exports.PredictionController = void 0;
const prediction_service_1 = require("../services/prediction.service");
class PredictionController {
    getLobby(req, res) {
        const tables = prediction_service_1.predictionService.getLobbyTables();
        res.status(200).json({
            success: true,
            data: tables
        });
    }
    getTableAnalysis(req, res) {
        const rawTableId = req.params.tableId;
        const tableId = Array.isArray(rawTableId) ? rawTableId[0] : (rawTableId || '');
        const hasPremium = !!req.user?.hasActiveSubscription;
        const analysis = prediction_service_1.predictionService.getTableAnalysis(tableId, hasPremium);
        res.status(200).json({
            success: true,
            data: analysis
        });
    }
}
exports.PredictionController = PredictionController;
exports.predictionController = new PredictionController();
//# sourceMappingURL=prediction.controller.js.map