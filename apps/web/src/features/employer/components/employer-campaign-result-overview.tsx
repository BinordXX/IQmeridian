import type { EmployerSessionSummary } from '../api/employer-dashboard-api';

type EmployerCampaignResultOverviewProps = {
  sessions: EmployerSessionSummary[];
};

const BAND_ORDER = ['ADVANCED', 'PROFICIENT', 'DEVELOPING', 'EMERGING'];

const getBandCount = (
  sessions: EmployerSessionSummary[],
  band: string
): number => {
  return sessions.filter((session) => {
    return session.score?.overallBand === band;
  }).length;
};

export const EmployerCampaignResultOverview = ({
  sessions,
}: EmployerCampaignResultOverviewProps) => {
  const scoredSessions = sessions.filter((session) => Boolean(session.score));
  const totalScored = scoredSessions.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">
          Campaign result overview
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          A compact view of candidate outcome bands within this campaign. This
          view is intended to help employers understand campaign-level patterns;
          it should not be used as a standalone ranking mechanism or final
          hiring decision.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {BAND_ORDER.map((band) => {
          const count = getBandCount(scoredSessions, band);
          const percentage =
            totalScored > 0 ? Math.round((count / totalScored) * 100) : 0;

          return (
            <div key={band}>
              <div className="flex items-center justify-between text-sm">
                <p className="font-medium text-slate-700">{band}</p>
                <p className="text-slate-500">
                  {count} candidate{count === 1 ? '' : 's'} · {percentage}%
                </p>
              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-950"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalScored === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No scored results are available yet for this campaign.
        </div>
      ) : null}
    </section>
  );
};
