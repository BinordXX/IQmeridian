type AssessmentStatePanelProps = {
  eyebrow: string;
  title: string;
  body: string;
  action?: React.ReactNode;
  tone?: 'neutral' | 'warning' | 'error' | 'success';
};

const getToneClasses = (
  tone: NonNullable<AssessmentStatePanelProps['tone']>
): string => {
  switch (tone) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900';
    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-900';
    case 'error':
      return 'border-red-200 bg-red-50 text-red-900';
    case 'neutral':
    default:
      return 'border-slate-200 bg-slate-50 text-slate-800';
  }
};

export const AssessmentStatePanel = ({
  eyebrow,
  title,
  body,
  action,
  tone = 'neutral',
}: AssessmentStatePanelProps) => {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div
        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getToneClasses(
          tone
        )}`}
      >
        {eyebrow}
      </div>

      <h1 className="mt-5 text-3xl font-bold text-slate-950">{title}</h1>

      <p className="mt-4 text-base leading-7 text-slate-600">{body}</p>

      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
};
