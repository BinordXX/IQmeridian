'use client';

import type {
  AssessmentResponseValue,
  CandidateAssessmentSection,
} from '../contracts/assessment-contracts';

type AssessmentProgressPanelProps = {
  sections: CandidateAssessmentSection[];
  currentItemId?: string;
  responses: Record<string, AssessmentResponseValue>;
  onSelectItem: (sectionId: string, itemId: string) => void;
};

export const AssessmentProgressPanel = ({
  sections,
  currentItemId,
  responses,
  onSelectItem,
}: AssessmentProgressPanelProps) => {
  const totalItems = sections.reduce(
    (count, section) => count + section.items.length,
    0
  );

  const answeredItems = sections.reduce((count, section) => {
    return (
      count +
      section.items.filter((item) => responses[item.itemId] !== undefined)
        .length
    );
  }, 0);

  return (
    <aside className="rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)] sm:rounded-[2rem] sm:p-5">
      <h2 className="text-base font-black text-white">Progress</h2>

      <p className="mt-2 text-sm text-slate-400">
        {answeredItems} of {totalItems} answered
      </p>

      <div className="mt-4 h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-cyan-300"
          style={{
            width:
              totalItems === 0
                ? '0%'
                : `${Math.round((answeredItems / totalItems) * 100)}%`,
          }}
        />
      </div>

      <div className="mt-6 space-y-5">
        {sections.map((section) => (
          <section key={section.sectionId}>
            <h3 className="text-sm font-black text-cyan-100">
              {section.title}
            </h3>

            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
              {section.items.map((item) => {
                const isCurrent = item.itemId === currentItemId;
                const isAnswered = responses[item.itemId] !== undefined;

                return (
                  <button
                    key={item.itemId}
                    type="button"
                    onClick={() => onSelectItem(section.sectionId, item.itemId)}
                    className={`min-h-11 rounded-xl border px-2 py-2 text-xs font-black transition ${
                      isCurrent
                        ? 'border-cyan-300 bg-cyan-300 text-[#020817]'
                        : isAnswered
                          ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-100'
                          : 'border-white/10 bg-white/[0.04] text-slate-400 hover:border-cyan-300/30 hover:text-cyan-100'
                    }`}
                  >
                    {item.position}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
};
