import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import type {
  PsychometricScoringRequest,
  PsychometricScoringResponse,
} from './psychometric-scoring-contract.types';

function isScoringResponse(
  value: unknown,
): value is PsychometricScoringResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'contractVersion' in value &&
    'sessionId' in value &&
    'overall' in value &&
    'domains' in value &&
    'timingProfile' in value &&
    'validityFlags' in value &&
    'audit' in value
  );
}

@Injectable()
export class PsychometricScoringClientService {
  private readonly baseUrl: string;
  private readonly internalToken: string;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    const configuredUrl = process.env.PSYCHOMETRICS_SERVICE_URL?.trim();

    const configuredToken = process.env.PSYCHOMETRICS_INTERNAL_TOKEN?.trim();

    if (isProduction) {
      if (!configuredUrl) {
        throw new Error('PSYCHOMETRICS_SERVICE_URL is required in production.');
      }

      if (
        !configuredToken ||
        configuredToken.length < 32 ||
        configuredToken === 'dev-psychometrics-token'
      ) {
        throw new Error(
          'A secure PSYCHOMETRICS_INTERNAL_TOKEN ' +
            'is required in production.',
        );
      }

      let parsedUrl: URL;

      try {
        parsedUrl = new URL(configuredUrl);
      } catch {
        throw new Error('PSYCHOMETRICS_SERVICE_URL must be a valid URL.');
      }

      const hostname = parsedUrl.hostname.toLowerCase().replace(/\.$/, '');

      const forbiddenHosts = new Set([
        'localhost',
        '127.0.0.1',
        '[::1]',
        '0.0.0.0',
      ]);

      if (
        !['http:', 'https:'].includes(parsedUrl.protocol) ||
        forbiddenHosts.has(hostname) ||
        parsedUrl.username ||
        parsedUrl.password
      ) {
        throw new Error(
          'Production psychometrics service URL ' +
            'must use a valid non-localhost HTTP address.',
        );
      }
    }

    this.baseUrl = (configuredUrl || 'http://127.0.0.1:8001').replace(
      /\/+$/,
      '',
    );

    this.internalToken = configuredToken || 'dev-psychometrics-token';
  }

  async scoreSession(
    request: PsychometricScoringRequest,
  ): Promise<PsychometricScoringResponse> {
    const url = `${this.baseUrl}/v1/scoring/score-session`;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-service-token': this.internalToken,
        },
        body: JSON.stringify(request),
      });
    } catch {
      throw new ServiceUnavailableException(
        'The psychometrics scoring service is not reachable.',
      );
    }

    if (!response.ok) {
      let details = '';

      try {
        const payload = (await response.json()) as {
          detail?: unknown;
          message?: unknown;
        };

        details = payload.detail
          ? ` ${JSON.stringify(payload.detail)}`
          : payload.message
            ? ` ${String(payload.message)}`
            : '';
      } catch {
        details = '';
      }

      throw new BadGatewayException(
        `The psychometrics scoring service returned HTTP ${response.status}.${details}`,
      );
    }

    const payload: unknown = await response.json();

    if (!isScoringResponse(payload)) {
      throw new BadGatewayException(
        'The psychometrics scoring service returned an invalid scoring response.',
      );
    }

    return payload;
  }
}
