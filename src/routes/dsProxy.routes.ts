import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { requireActiveSubscription } from '../middleware/subscriptionAccess.middleware';
import { dsProxyService } from '../services/dsProxy.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Helper to handle DS API proxy errors consistently
 */
function handleDsError(err: any, res: Response): void {
  if (err.message === 'DS_NOT_CONFIGURED') {
    res.status(503).json({
      success: false,
      error: {
        code: 'DS_NOT_CONFIGURED',
        message: 'Dealer Signature API is not configured. Admin must set the API key and URL in Tool Settings.'
      }
    });
    return;
  }
  logger.error('DS Proxy error:', err);
  res.status(502).json({
    success: false,
    error: {
      code: 'DS_PROXY_ERROR',
      message: err.message || 'Failed to communicate with the Dealer Signature API'
    }
  });
}

/**
 * GET /ds/config - Public check if DS API is configured (no auth needed for UI bootstrap)
 */
router.get('/config', async (_req: Request, res: Response) => {
  try {
    const config = await dsProxyService.isConfigured();
    res.json({ success: true, data: config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// All remaining DS routes require authentication + active subscription
router.use(requireAuth);
router.use(requireActiveSubscription);

/**
 * GET /ds/status - DS API service status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const result = await dsProxyService.getStatus();
    res.json(result);
  } catch (err: any) {
    handleDsError(err, res);
  }
});

/**
 * GET /ds/tables - List all live tables
 */
router.get('/tables', async (req: Request, res: Response) => {
  try {
    const { provider, search, filter, sort, window, limit } = req.query;
    const result = await dsProxyService.getTables({
      provider: provider as string,
      search: search as string,
      filter: filter as string,
      sort: sort as string,
      window: window ? Number(window) : undefined,
      limit: limit ? Number(limit) : undefined
    });
    res.json(result);
  } catch (err: any) {
    handleDsError(err, res);
  }
});

/**
 * GET /ds/tables/:tableId/prediction - Get prediction for a table
 */
router.get('/tables/:tableId/prediction', async (req: Request, res: Response) => {
  try {
    const tableId = String(req.params.tableId);
    const { direction, window } = req.query;
    const result = await dsProxyService.getTablePrediction(
      tableId,
      direction as string,
      window ? Number(window) : undefined
    );
    res.json(result);
  } catch (err: any) {
    handleDsError(err, res);
  }
});

/**
 * GET /ds/tables/:tableId/travel-chart - Get travel chart data
 */
router.get('/tables/:tableId/travel-chart', async (req: Request, res: Response) => {
  try {
    const tableId = String(req.params.tableId);
    const { direction, window } = req.query;
    const result = await dsProxyService.getTableTravelChart(
      tableId,
      direction as string,
      window ? Number(window) : undefined
    );
    res.json(result);
  } catch (err: any) {
    handleDsError(err, res);
  }
});

/**
 * GET /ds/tables/:tableId/pattern - Get pattern/structures data
 */
router.get('/tables/:tableId/pattern', async (req: Request, res: Response) => {
  try {
    const tableId = String(req.params.tableId);
    const { direction, window } = req.query;
    const result = await dsProxyService.getTablePattern(
      tableId,
      direction as string,
      window ? Number(window) : undefined
    );
    res.json(result);
  } catch (err: any) {
    handleDsError(err, res);
  }
});

/**
 * GET /ds/tables/:tableId/history - Get dealer history
 */
router.get('/tables/:tableId/history', async (req: Request, res: Response) => {
  try {
    const tableId = String(req.params.tableId);
    const { period, page, limit, window } = req.query;
    const result = await dsProxyService.getTableHistory(tableId, {
      period: period as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      window: window ? Number(window) : undefined
    });
    res.json(result);
  } catch (err: any) {
    handleDsError(err, res);
  }
});

/**
 * POST /ds/scanner - Scan all tables
 */
router.post('/scanner', async (req: Request, res: Response) => {
  try {
    const result = await dsProxyService.scanTables(req.body);
    res.json(result);
  } catch (err: any) {
    handleDsError(err, res);
  }
});

export const dsProxyRoutes = router;
