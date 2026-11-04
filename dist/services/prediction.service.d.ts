import { RouletteTable, TableAnalysisResponse } from '../shared/predictions';
export declare class PredictionService {
    getLobbyTables(): RouletteTable[];
    getTableAnalysis(tableId: string, hasPremiumAccess: boolean): TableAnalysisResponse;
}
export declare const predictionService: PredictionService;
