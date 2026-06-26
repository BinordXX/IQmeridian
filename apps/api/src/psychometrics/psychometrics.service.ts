import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import { PsychometricScorePersistenceService } from './psychometric-score-persistence.service';
import { PsychometricScoringClientService } from './psychometric-scoring-client.service';
import { PsychometricScoringRequestBuilderService } from './psychometric-scoring-request-builder.service';
import {
  PsychometricsCapabilitiesResponse,
  PsychometricsHealthResponse,
  PsychometricsJsonObject,
  PsychometricsVersionResponse,
} from './psychometrics.types';

function isJsonObject(value: unknown): value is PsychometricsJsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

@Injectable()
export class PsychometricsService {
  private readonly baseUrl =
    process.env.PSYCHOMETRICS_SERVICE_URL ?? 'http://127.0.0.1:8001';

  private readonly internalToken =
    process.env.PSYCHOMETRICS_INTERNAL_TOKEN ?? 'dev-psychometrics-token';

  constructor(
    private readonly requestBuilder: PsychometricScoringRequestBuilderService,
    private readonly scoringClient: PsychometricScoringClientService,
    private readonly scorePersistence: PsychometricScorePersistenceService,
  ) {}

  async getHealth(): Promise<PsychometricsHealthResponse> {
    return this.getFromPsychometrics<PsychometricsHealthResponse>('/health');
  }

  async getVersion(): Promise<PsychometricsVersionResponse> {
    return this.getFromPsychometrics<PsychometricsVersionResponse>('/version');
  }

  async getCapabilities(): Promise<PsychometricsCapabilitiesResponse> {
    return this.getFromPsychometrics<PsychometricsCapabilitiesResponse>(
      '/capabilities',
    );
  }

  async scoreSession(sessionId: string) {
    const request = await this.requestBuilder.buildForSession(sessionId);
    const response = await this.scoringClient.scoreSession(request);

    return this.scorePersistence.upsertSessionScore(response);
  }

  async getSessionScore(sessionId: string) {
    return this.scorePersistence.getSessionScore(sessionId);
  }

  private async getFromPsychometrics<T extends PsychometricsJsonObject>(
    path: string,
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    let response: Response;

    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-internal-service-token': this.internalToken,
        },
      });
    } catch {
      throw new ServiceUnavailableException(
        'The psychometrics service is not reachable.',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `The psychometrics service returned HTTP ${response.status}.`,
      );
    }

    const payload: unknown = await response.json();

    if (!isJsonObject(payload)) {
      throw new BadGatewayException(
        'The psychometrics service returned an invalid response.',
      );
    }

    return payload as T;
  }
}
