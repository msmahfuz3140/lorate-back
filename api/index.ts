import type { Request, Response } from 'express';
import { app } from '../src/app';
import { db } from '../src/database/connection';
import { initializeAuthoritativeAdmin } from '../src/database/initAdmin';
import { logger } from '../src/utils/logger';

let isConnected = false;

async function ensureDbConnected() {
  if (!isConnected) {
    await db.connect();
    await initializeAuthoritativeAdmin().catch((err) => {
      logger.error('Failed to initialize admin during serverless start:', err);
    });
    isConnected = true;
  }
}

export default async function handler(req: Request, res: Response) {
  try {
    await ensureDbConnected();

    // Delegate to Express and ensure the serverless execution context waits for response completion
    return new Promise<void>((resolve, reject) => {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);
      app(req, res);
    });
  } catch (error) {
    logger.error('Serverless request handling error:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error occurred.'
        }
      });
    }
  }
}

