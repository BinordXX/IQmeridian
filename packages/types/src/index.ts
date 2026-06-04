export type PlatformRole =
  | 'PLATFORM_ADMIN'
  | 'EMPLOYER_ADMIN'
  | 'CANDIDATE'
  | 'CONSUMER'
  | 'RESEARCHER';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: PlatformRole;
  name?: string | null;
}

export interface OrganisationSummary {
  id: string;
  name: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  database: 'connected' | 'failed';
  redis?: 'connected' | 'failed';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
