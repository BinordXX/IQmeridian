import Link from 'next/link';
import type { ReactNode } from 'react';

type InternalWorkspaceCardProps = {
  title: string;
  body: string;
  href: string;
  actionLabel: string;
  meta?: ReactNode;
};

export const InternalWorkspaceCard = ({
  title,
  body,
  href,
  actionLabel,
  meta,
}: InternalWorkspaceCardProps) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>

      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>

      {meta ? <div className="mt-5">{meta}</div> : null}

      <Link
        href={href}
        className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        {actionLabel}
      </Link>
    </section>
  );
};
