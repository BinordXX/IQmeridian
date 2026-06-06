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
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="text-lg font-semibold text-slate-950">
          Candidate comparison
        </h3>

        <p className="mt-1 text-sm text-slate-600">
          Compare candidates within this campaign only. The table supports
          structured review and should be interpreted alongside wider hiring
          evidence rather than as an automatic selection order. If no results
          are ready, candidates will remain visible with unavailable bands until
          scoring and reporting are complete.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-sm text-slate-500">
              <th className="px-4 py-3 font-medium">Candidate</th>
              <th className="px-4 py-3 font-medium">Overall</th>
              <th className="px-4 py-3 font-medium">Abstract</th>
              <th className="px-4 py-3 font-medium">Numerical</th>
              <th className="px-4 py-3 font-medium">Completion</th>
              <th className="px-4 py-3 font-medium">Action</th>
            </tr>
          </thead>

          <tbody>
            {rankedSessions.length > 0 ? (
              rankedSessions.map((session) => (
                <tr key={session.id} className="border-t border-slate-100">
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-slate-950">
                      {getCandidateIdentifier(session)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.invitation?.email ?? session.id}
                    </p>
                  </td>

                  <td className="px-4 py-4 align-top text-sm text-slate-700">
                    {session.score?.overallBand ?? 'Not available'}
                  </td>

                  <td className="px-4 py-4 align-top text-sm text-slate-700">
                    {session.score?.abstractBand ?? 'Not available'}
                  </td>

                  <td className="px-4 py-4 align-top text-sm text-slate-700">
                    {session.score?.numericalBand ?? 'Not available'}
                  </td>

                  <td className="px-4 py-4 align-top text-sm text-slate-700">
                    {session.status === 'COMPLETED'
                      ? 'Completed'
                      : session.status}
                  </td>

                  <td className="px-4 py-4 align-top text-sm">
                    <Link
                      href={`/employer/campaigns/${encodeURIComponent(
                        campaignId
                      )}/candidates/${encodeURIComponent(session.id)}`}
                      className="font-semibold text-slate-950 hover:underline"
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
