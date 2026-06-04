import { getEmployerDashboardData } from '@/features/employer/api/employer-dashboard-api';
import { EmployerCampaignList } from '@/features/employer/components/employer-campaign-list';

const getCampaignListDataSafely = async () => {
  try {
    return await getEmployerDashboardData();
  } catch {
    return null;
  }
};

export default async function EmployerCampaignsPage() {
  const data = await getCampaignListDataSafely();

  if (!data) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Campaign list unavailable
        </p>

        <h2 className="mt-3 text-2xl font-bold text-red-950">
          Campaign data could not be loaded
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-red-800">
          Confirm that the API server is running, the employer token matches the
          seeded employer user, and the campaign and session endpoints are
          available.
        </p>
      </section>
    );
  }

  return (
    <EmployerCampaignList campaigns={data.campaigns} sessions={data.sessions} />
  );
}
