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
    <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <div>
        <h3 className="text-lg font-black text-white">
          Campaign result overview
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
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
                <p className="font-black text-slate-200">{band}</p>
                <p className="text-slate-500">
                  {count} candidate{count === 1 ? '' : 's'} · {percentage}%
                </p>
              </div>

              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-cyan-300/70"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {totalScored === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-slate-400">
          No scored results are available yet for this campaign.
        </div>
      ) : null}
    </section>
  );
};
