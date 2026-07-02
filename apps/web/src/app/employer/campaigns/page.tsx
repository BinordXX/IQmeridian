import Link from 'next/link';

import { getEmployerDashboardData } from '@/features/employer/api/employer-dashboard-api';
import { EmployerCampaignList } from '@/features/employer/components/employer-campaign-list';

export default async function EmployerCampaignsPage() {
  let data: Awaited<ReturnType<typeof getEmployerDashboardData>> | null = null;
  let errorMessage: string | null = null;

  try {
    data = await getEmployerDashboardData();
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : 'Unable to load employer campaigns.';
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Campaign management
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
              Campaigns
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
              View all assessment campaigns associated with this employer
              workspace. Campaigns connect assessment forms, invitations,
              participant activity, and completion progress.
            </p>
          </div>

          <Link
            className="inline-flex w-fit items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
            href="/employer/campaigns/new"
          >
            Create campaign
          </Link>
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-[2rem] border border-red-300/20 bg-red-400/10 p-5 text-sm font-bold leading-6 text-red-100">
          {errorMessage}
        </section>
      ) : (
        <EmployerCampaignList campaigns={data?.campaigns ?? []} />
      )}
    </div>
  );
}