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
      return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100';
    case 'warning':
      return 'border-amber-300/25 bg-amber-400/10 text-amber-100';
    case 'error':
      return 'border-red-300/25 bg-red-400/10 text-red-100';
    case 'neutral':
    default:
      return 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
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
    <section className="mx-auto max-w-3xl rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/95 p-8 text-center shadow-[0_24px_90px_rgba(0,0,0,0.36)]">
      <div
        className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${getToneClasses(
          tone
        )}`}
      >
        {eyebrow}
      </div>

      <h1 className="mt-5 text-3xl font-black text-white">{title}</h1>

      <p className="mt-4 text-base leading-7 text-slate-300">{body}</p>

      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
};
