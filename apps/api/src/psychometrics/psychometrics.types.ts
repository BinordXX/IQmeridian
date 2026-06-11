export type InternalPsychometricsRole = 'PLATFORM_ADMIN' | 'RESEARCHER';

export type PsychometricsJsonObject = Record<string, unknown>;

export interface PsychometricsHealthResponse extends PsychometricsJsonObject {
  status: string;
  service: string;
  version: string;
  environment: string;
}

export interface PsychometricsVersionResponse extends PsychometricsJsonObject {
  service: string;
  version: string;
}

export interface PsychometricsCapabilitiesResponse extends PsychometricsJsonObject {
  service: string;
  version: string;
  responsibilities: string[];
  non_responsibilities: string[];
  intended_consumers: string[];
  data_principles: string[];
}
