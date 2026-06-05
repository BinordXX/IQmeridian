import {
  getEmployerCampaignById,
  getEmployerDashboardData,
  type EmployerCampaignDetail,
  type EmployerDashboardData,
} from '../api/employer-dashboard-api';

type EmployerWorkspaceGuardResult =
  | {
      allowed: true;
      data: EmployerDashboardData;
    }
  | {
      allowed: false;
      reason: 'unauthorised' | 'unavailable';
    };

type EmployerCampaignGuardResult =
  | {
      allowed: true;
      campaign: EmployerCampaignDetail;
    }
  | {
      allowed: false;
      reason: 'unauthorised' | 'not-found' | 'unavailable';
    };

export const guardEmployerWorkspaceRoute =
  async (): Promise<EmployerWorkspaceGuardResult> => {
    try {
      const data = await getEmployerDashboardData();

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

export const guardEmployerCampaignRoute = async (
  campaignId: string
): Promise<EmployerCampaignGuardResult> => {
  try {
    const campaign = await getEmployerCampaignById(campaignId);

    return {
      allowed: true,
      campaign,
    };
  } catch {
    return {
      allowed: false,
      reason: 'unavailable',
    };
  }
};
