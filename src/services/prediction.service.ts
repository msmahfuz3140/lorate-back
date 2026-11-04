import { RouletteTable, TableAnalysisResponse, StrategyType } from '../shared/predictions';

// Realistic table definitions matching Evolution & Pragmatic Play European Roulette
const MOCK_TABLES: RouletteTable[] = [
  {
    id: 'evo-lightning',
    name: 'Lightning Roulette',
    provider: 'Evolution Gaming',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    isLive: true,
    recentNumbers: [14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26],
    activeStrategy: StrategyType.DEALER_SIGNATURE,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'evo-speed-1',
    name: 'Speed Roulette 1',
    provider: 'Evolution Gaming',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=600&q=80',
    isLive: true,
    recentNumbers: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27],
    activeStrategy: StrategyType.TARGET,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'evo-vip-roulette',
    name: 'VIP Roulette',
    provider: 'Evolution Gaming',
    thumbnailUrl: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=600&q=80',
    isLive: true,
    recentNumbers: [23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22],
    activeStrategy: StrategyType.OFFSET,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'prag-roulette-1',
    name: 'Pragmatic Azure Roulette',
    provider: 'Pragmatic Play',
    thumbnailUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=600&q=80',
    isLive: true,
    recentNumbers: [7, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20],
    activeStrategy: StrategyType.OFFSET,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'prag-roulette-ruby',
    name: 'Pragmatic Ruby Roulette',
    provider: 'Pragmatic Play',
    thumbnailUrl: 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=600&q=80',
    isLive: true,
    recentNumbers: [26, 3, 35, 12, 28, 7, 29, 18, 22, 9, 31, 14],
    activeStrategy: StrategyType.DEALER_SIGNATURE,
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'evo-immersive',
    name: 'Immersive Roulette',
    provider: 'Evolution Gaming',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    isLive: true,
    recentNumbers: [17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5],
    activeStrategy: StrategyType.TARGET,
    lastUpdated: new Date().toISOString()
  }
];

export class PredictionService {
  getLobbyTables(): RouletteTable[] {
    return MOCK_TABLES;
  }

  getTableAnalysis(tableId: string, hasPremiumAccess: boolean): TableAnalysisResponse {
    const table = MOCK_TABLES.find(t => t.id === tableId) || MOCK_TABLES[0];

    if (!hasPremiumAccess) {
      return {
        tableId: table.id,
        tableName: table.name,
        provider: table.provider,
        recentNumbers: table.recentNumbers,
        isLocked: true
      };
    }

    return {
      tableId: table.id,
      tableName: table.name,
      provider: table.provider,
      recentNumbers: table.recentNumbers,
      isLocked: false,
      offsetStrategy: {
        predictedNumbers: [
          { number: 25, neighbours: 1 },
          { number: 20, neighbours: 3 },
          { number: 32, neighbours: 3 }
        ],
        calculationMethod: 'Playing (+ and -1)',
        confirmedSpins: 4,
        distance: 1,
        hitRate: 83.3,
        isRecommended: true
      },
      targetStrategy: {
        predictedNumbers: [
          { number: 15, neighbours: 7 }
        ],
        patternSequence: ['W', 'W', 'W', 'L', 'W', 'W', 'W'],
        streakCount: 3,
        momentum: 'HOT',
        isExitSignal: false
      },
      dealerSignature: {
        predictedNumbers: [
          { number: 0, neighbours: 4 }
        ],
        travelLinePosition: 'OVER',
        travelDistance: 'SMALL',
        topNumbers: [
          { number: 0, neighbours: 4 },
          { number: 32, neighbours: 4 }
        ],
        phaseConsistency: 88.8
      }
    };
  }
}

export const predictionService = new PredictionService();
