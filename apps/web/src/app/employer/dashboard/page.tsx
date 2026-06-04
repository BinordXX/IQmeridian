import { getEmployerDashboardData } from '@/features/employer/api/employer-dashboard-api';
import { EmployerDashboardOverview } from '@/features/employer/components/employer-dashboard-overview';

const getDashboardDataSafely = async () => {
  try {
    return await getEmployerDashboardData();
  } catch {
    return null;
  }
};

export default async function EmployerDashboardPage() {
  const data = await getDashboardDataSafely();

  if (!data) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-700">
          Employer dashboard unavailable
        </p>

        <h2 className="mt-3 text-2xl font-bold text-red-950">
          The employer workspace could not be loaded
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-red-800">
          The dashboard could not retrieve campaign or session data from the
          API. Confirm that the API server is running, the employer development
          token matches seeded users, and the campaign endpoints are available.
        </p>
      </section>
    );
  }

  return <EmployerDashboardOverview data={data} />;
}
