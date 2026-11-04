import type { Request, Response } from 'express';
import { app } from '../src/app';
import { db } from '../src/database/connection';
import { initializeAuthoritativeAdmin } from '../src/database/initAdmin';
import { logger } from '../src/utils/logger';

let isConnected = false;

export default async function handler(req: Request, res: Response) {
  try {
    if (!isConnected) {
      await db.connect();
      await initializeAuthoritativeAdmin().catch((err) => {
        logger.error('Failed to initialize admin during serverless start:', err);
      });
      isConnected = true;
    }
    return app(req, res);
  } catch (error) {
    logger.error('Serverless request handling error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error occurred.'
      }
    });
  }
}

