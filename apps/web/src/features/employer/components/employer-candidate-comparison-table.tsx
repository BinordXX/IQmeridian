import Link from 'next/link';

import type { EmployerSessionSummary } from '../api/employer-dashboard-api';

type EmployerCandidateComparisonTableProps = {
  campaignId: string;
  sessions: EmployerSessionSummary[];
};

const BAND_RANK: Record<string, number> = {
  ADVANCED: 4,
  PROFICIENT: 3,
  DEVELOPING: 2,
  EMERGING: 1,
};

const getCandidateIdentifier = (session: EmployerSessionSummary): string => {
  return (
    session.user?.name ??
    session.user?.email ??
    session.invitation?.email ??
    session.userId
  );
};

const getBandRank = (band?: string): number => {
  if (!band) {
    return 0;
  }

  return BAND_RANK[band] ?? 0;
};

export const EmployerCandidateComparisonTable = ({
  campaignId,
  sessions,
}: EmployerCandidateComparisonTableProps) => {
  const rankedSessions = [...sessions].sort((first, second) => {
    return (
      getBandRank(second.score?.overallBand) -
      getBandRank(first.score?.overallBand)
    );
  });

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/88 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <div className="border-b border-white/10 px-5 py-4">
        <h3 className="text-lg font-black text-white">Candidate comparison</h3>

        <p className="mt-1 text-sm leading-6 text-slate-400">
          Compare candidates within this campaign only. The table supports
          structured review and should be interpreted alongside wider hiring
          evidence rather than as an automatic selection order.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Overall</th>
              <th className="px-4 py-3">Abstract</th>
              <th className="px-4 py-3">Numerical</th>
              <th className="px-4 py-3">Completion</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {rankedSessions.length > 0 ? (
              rankedSessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-white/10 align-top last:border-b-0"
                >
                  <td className="px-4 py-4">
                    <p className="font-black text-white">
                      {getCandidateIdentifier(session)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.invitation?.email ?? session.id}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-sm font-bold text-slate-300">
                    {session.score?.overallBand ?? 'Not available'}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-400">
                    {session.score?.abstractBand ?? 'Not available'}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-400">
                    {session.score?.numericalBand ?? 'Not available'}
                  </td>

                  <td className="px-4 py-4 text-sm text-slate-400">
                    {session.status === 'COMPLETED'
                      ? 'Completed'
                      : session.status}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <Link
                      href={`/employer/campaigns/${encodeURIComponent(
                        campaignId
                      )}/candidates/${encodeURIComponent(session.id)}`}
                      className="font-black text-cyan-100 hover:underline"
                    >
                      View details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No candidate sessions are available for comparison. Candidates
                  will appear here after they start the assessment.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
