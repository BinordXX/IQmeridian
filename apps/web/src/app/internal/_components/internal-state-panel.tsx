import Link from 'next/link';

type InternalStatePanelVariant = 'loading' | 'empty' | 'error' | 'unauthorised';

export function InternalStatePanel({
  variant,
  title,
  message,
  actionHref,
  actionLabel,
}: {
  variant: InternalStatePanelVariant;
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  const eyebrowByVariant: Record<InternalStatePanelVariant, string> = {
    loading: 'Loading',
    empty: 'No data',
    error: 'Internal tooling error',
    unauthorised: 'Access restricted',
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
        {eyebrowByVariant[variant]}
      </p>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h1>

      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
        {message}
      </p>

      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}
