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
  private readonly baseUrl =
    process.env.PSYCHOMETRICS_SERVICE_URL ?? 'http://127.0.0.1:8001';

  private readonly internalToken =
    process.env.PSYCHOMETRICS_INTERNAL_TOKEN ?? 'dev-psychometrics-token';

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
