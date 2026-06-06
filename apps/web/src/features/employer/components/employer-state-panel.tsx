import type { ReactNode } from 'react';

type EmployerStatePanelTone = 'neutral' | 'warning' | 'danger' | 'success';

type EmployerStatePanelProps = {
  eyebrow: string;
  title: string;
  body: string;
  tone?: EmployerStatePanelTone;
  action?: ReactNode;
};

const getToneClasses = (tone: EmployerStatePanelTone): string => {
  switch (tone) {
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-900';

    case 'warning':
      return 'border-amber-200 bg-amber-50 text-amber-900';

    case 'danger':
      return 'border-red-200 bg-red-50 text-red-900';

    case 'neutral':
    default:
      return 'border-slate-200 bg-white text-slate-900';
  }
};

export const EmployerStatePanel = ({
  eyebrow,
  title,
  body,
  tone = 'neutral',
  action,
}: EmployerStatePanelProps) => {
  return (
    <section
      className={`rounded-2xl border p-8 shadow-sm ${getToneClasses(tone)}`}
    >
      <p className="text-sm font-semibold uppercase tracking-wide opacity-80">
        {eyebrow}
      </p>

      <h2 className="mt-3 text-2xl font-bold">{title}</h2>

      <p className="mt-3 max-w-3xl text-sm leading-6 opacity-90">{body}</p>

      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
};
