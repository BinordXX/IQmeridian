import {
  getPlatformAdminOperationalData,
  getResearcherOperationalData,
  type InternalOperationalData,
} from '../api/internal-api';

type InternalRouteGuardResult =
  | {
      allowed: true;
      data: InternalOperationalData;
    }
  | {
      allowed: false;
      reason: 'unauthorised' | 'unavailable';
    };

export const guardPlatformAdminRoute =
  async (): Promise<InternalRouteGuardResult> => {
    try {
      const data = await getPlatformAdminOperationalData();

      return {
        allowed: true,
        data,
      };
    } catch {
      return {
        allowed: false,
        reason: 'unavailable',
      };
    }
  };

export const guardResearcherRoute =
  async (): Promise<InternalRouteGuardResult> => {
    try {
      const data = await getResearcherOperationalData();

      return {
        allowed: true,
        data,
      };
    } catch {
      return {
        allowed: false,
        reason: 'unavailable',
      };
    }
  };
