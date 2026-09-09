import type {
  CandidateResultThresholdConfig,
  EmployerSessionSummary,
} from '../api/employer-dashboard-api';
import {
  classifyEmployerSessionByThresholds,
  getCandidateThresholdClassificationLabel,
  type CandidateThresholdClassification,
} from '../utils/employer-candidate-thresholds';

type EmployerCandidateThresholdSummaryProps = {
  sessions: EmployerSessionSummary[];
  thresholdConfig?: CandidateResultThresholdConfig | null;
};

const classificationOrder: CandidateThresholdClassification[] = [
  'meets_filter',
  'below_filter',
  'review_required',
  'not_scored',
  'not_completed',
];

const classificationClassName: Record<
  CandidateThresholdClassification,
  string
> = {
  meets_filter: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
  below_filter: 'border-amber-300/20 bg-amber-400/10 text-amber-100',
  review_required: 'border-red-300/20 bg-red-400/10 text-red-100',
  not_scored: 'border-slate-300/15 bg-white/[0.04] text-slate-300',
  not_completed: 'border-blue-300/20 bg-blue-400/10 text-blue-100',
};

const getCandidateName = (session: EmployerSessionSummary) => {
  return (
    session.applicantName ??
    session.applicantEmail ??
    session.invitation?.email ??
    session.user?.email ??
    session.user?.name ??
    session.id
  );
};

export const EmployerCandidateThresholdSummary = ({
  sessions,
  thresholdConfig,
}: EmployerCandidateThresholdSummaryProps) => {
  const counts = classificationOrder.reduce<
    Record<CandidateThresholdClassification, number>
  >(
    (currentCounts, classification) => ({
      ...currentCounts,
      [classification]: 0,
    }),
    {
      meets_filter: 0,
      below_filter: 0,
      review_required: 0,
      not_scored: 0,
      not_completed: 0,
    }
  );

  const classifiedSessions = sessions.map((session) => {
    const classification = classifyEmployerSessionByThresholds(
      session,
      thresholdConfig
    );

    counts[classification] += 1;

    return {
      session,
      classification,
    };
  });

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
          Filtered candidate view
        </p>

        <h3 className="mt-2 text-lg font-black text-white">
          Threshold classification
        </h3>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          This view classifies candidates against the campaign threshold
          configuration. It is a review aid only and does not perform automatic
          selection decisions.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        {classificationOrder.map((classification) => (
          <div
            key={classification}
            className={`rounded-2xl border p-4 ${classificationClassName[classification]}`}
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] opacity-80">
              {getCandidateThresholdClassificationLabel(classification)}
            </p>
            <p className="mt-2 text-3xl font-black">{counts[classification]}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-white/10 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Overall</th>
              <th className="px-4 py-3">Classification</th>
            </tr>
          </thead>

          <tbody>
            {classifiedSessions.length > 0 ? (
              classifiedSessions.map(({ session, classification }) => (
                <tr
                  key={session.id}
                  className="border-b border-white/10 align-top last:border-b-0"
                >
                  <td className="px-4 py-4">
                    <p className="font-black text-white">
                      {getCandidateName(session)}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {session.id}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-sm font-bold text-slate-300">
                    {session.status}
                  </td>

                  <td className="px-4 py-4 text-sm font-black text-cyan-100">
                    {session.psychometricScoreResult?.overallScoreBand ??
                      session.score?.overallBand ??
                      'Not scored'}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${classificationClassName[classification]}`}
                    >
                      {getCandidateThresholdClassificationLabel(classification)}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No candidate sessions are available for threshold
                  classification.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
