import crypto from 'node:crypto';
import { toolSettingsService } from './toolSettings.service';
import { logger } from '../utils/logger';

const EMPTY_BODY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

interface DsApiResponse {
  success: boolean;
  data?: any;
  error?: any;
  meta?: any;
}

export class DsProxyService {
  /**
   * Build HMAC-SHA256 signed headers for the DS API
   */
  private signRequest(
    apiKey: string,
    method: string,
    requestTarget: string,
    bodyBytes: string
  ): Record<string, string> {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('base64url');
    const bodyHash = bodyBytes
      ? crypto.createHash('sha256').update(bodyBytes).digest('hex')
      : EMPTY_BODY_HASH;

    const canonical = `${timestamp}\n${method.toUpperCase()}\n${requestTarget}\n${bodyHash}\n${nonce}`;

    const signature = crypto
      .createHmac('sha256', apiKey)
      .update(canonical)
      .digest('hex');

    return {
      'x-api-key': apiKey,
      'x-timestamp': timestamp,
      'x-nonce': nonce,
      'x-signature': signature,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Ensure DS API credentials are configured
   */
  private async getCredentials(): Promise<{ apiKey: string; baseUrl: string }> {
    const creds = await toolSettingsService.getDsApiCredentials();
    if (!creds.dsApiKey || !creds.dsApiUrl) {
      throw new Error('DS_NOT_CONFIGURED');
    }
    let cleanBase = creds.dsApiUrl.trim().replace(/\/+$/, '');
    if (cleanBase.endsWith('/api/v1')) {
      cleanBase = cleanBase.substring(0, cleanBase.length - '/api/v1'.length);
    } else if (cleanBase.endsWith('/api')) {
      cleanBase = cleanBase.substring(0, cleanBase.length - '/api'.length);
    }
    return { apiKey: creds.dsApiKey.trim(), baseUrl: cleanBase };
  }

  /**
   * Make a signed GET request to the DS API
   */
  private async signedGet(path: string): Promise<DsApiResponse> {
    const { apiKey, baseUrl } = await this.getCredentials();
    const headers = this.signRequest(apiKey, 'GET', path, '');

    const url = `${baseUrl}${path}`;
    logger.debug(`DS Proxy GET: ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers
    });

    const json = await res.json() as DsApiResponse;
    if (!res.ok && !json.error) {
      throw new Error(`DS API returned ${res.status}: ${res.statusText}`);
    }
    return json;
  }

  /**
   * Make a signed POST request to the DS API
   */
  private async signedPost(path: string, body: any): Promise<DsApiResponse> {
    const { apiKey, baseUrl } = await this.getCredentials();
    const bodyStr = JSON.stringify(body);
    const headers = this.signRequest(apiKey, 'POST', path, bodyStr);

    const url = `${baseUrl}${path}`;
    logger.debug(`DS Proxy POST: ${url}`);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyStr
    });

    const json = await res.json() as DsApiResponse;
    if (!res.ok && !json.error) {
      throw new Error(`DS API returned ${res.status}: ${res.statusText}`);
    }
    return json;
  }

  /**
   * Build query string from params object
   */
  private buildQuery(params: Record<string, string | number | undefined>): string {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
    if (entries.length === 0) return '';
    return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
  }

  // ─── Public API Methods ───────────────────────────────────────────

  /**
   * GET /api/v1/status
   */
  async getStatus(): Promise<DsApiResponse> {
    return this.signedGet('/api/v1/status');
  }

  /**
   * GET /api/v1/tables
   */
  async getTables(query?: {
    provider?: string;
    search?: string;
    filter?: string;
    sort?: string;
    window?: number;
    limit?: number;
  }): Promise<DsApiResponse> {
    const qs = this.buildQuery(query || {});
    return this.signedGet(`/api/v1/tables${qs}`);
  }

  /**
   * GET /api/v1/tables/:tableId/prediction
   */
  async getTablePrediction(
    tableId: string,
    direction?: string,
    window?: number
  ): Promise<DsApiResponse> {
    const qs = this.buildQuery({ direction, window });
    return this.signedGet(`/api/v1/tables/${encodeURIComponent(tableId)}/prediction${qs}`);
  }

  /**
   * GET /api/v1/tables/:tableId/travel-chart
   */
  async getTableTravelChart(
    tableId: string,
    direction?: string,
    window?: number
  ): Promise<DsApiResponse> {
    const qs = this.buildQuery({ direction, window });
    return this.signedGet(`/api/v1/tables/${encodeURIComponent(tableId)}/travel-chart${qs}`);
  }

  /**
   * GET /api/v1/tables/:tableId/pattern
   */
  async getTablePattern(
    tableId: string,
    direction?: string,
    window?: number
  ): Promise<DsApiResponse> {
    const qs = this.buildQuery({ direction, window });
    return this.signedGet(`/api/v1/tables/${encodeURIComponent(tableId)}/pattern${qs}`);
  }

  /**
   * GET /api/v1/tables/:tableId/history
   */
  async getTableHistory(
    tableId: string,
    query?: {
      period?: string;
      page?: number;
      limit?: number;
      window?: number;
    }
  ): Promise<DsApiResponse> {
    const qs = this.buildQuery(query || {});
    return this.signedGet(`/api/v1/tables/${encodeURIComponent(tableId)}/history${qs}`);
  }

  /**
   * POST /api/v1/scanner
   */
  async scanTables(body?: {
    min_spins?: number;
    min_accuracy?: number;
    min_rhythm?: number;
    direction?: string;
    sort?: string;
    window?: number;
  }): Promise<DsApiResponse> {
    return this.signedPost('/api/v1/scanner', body || {});
  }

  /**
   * Check if the DS API is configured
   */
  async isConfigured(): Promise<{ configured: boolean; apiUrl: string }> {
    const creds = await toolSettingsService.getDsApiCredentials();
    return {
      configured: !!(creds.dsApiKey && creds.dsApiUrl),
      apiUrl: creds.dsApiUrl || ''
    };
  }
}

export const dsProxyService = new DsProxyService();
