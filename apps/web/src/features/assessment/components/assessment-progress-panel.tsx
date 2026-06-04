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
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">Progress</h2>

      <p className="mt-2 text-sm text-slate-600">
        {answeredItems} of {totalItems} answered
      </p>

      <div className="mt-4 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-slate-950"
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
            <h3 className="text-sm font-semibold text-slate-900">
              {section.title}
            </h3>

            <div className="mt-3 grid grid-cols-5 gap-2">
              {section.items.map((item) => {
                const isCurrent = item.itemId === currentItemId;
                const isAnswered = responses[item.itemId] !== undefined;

                return (
                  <button
                    key={item.itemId}
                    type="button"
                    onClick={() => onSelectItem(section.sectionId, item.itemId)}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                      isCurrent
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : isAnswered
                          ? 'border-slate-300 bg-slate-100 text-slate-900'
                          : 'border-slate-200 bg-white text-slate-500'
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
