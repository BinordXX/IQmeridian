import Link from 'next/link';
import type { ReactNode } from 'react';

import { InternalAccessBoundary } from './_components/internal-access-boundary';

type InternalLayoutProps = {
  children: ReactNode;
};

export default function InternalLayout({ children }: InternalLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              IQMeridian internal tooling
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">
              Researcher and platform administration
            </h1>
          </div>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/internal" className="hover:text-slate-950">
              Overview
            </Link>
            <Link href="/internal/admin" className="hover:text-slate-950">
              Platform admin
            </Link>
            <Link href="/internal/researcher" className="hover:text-slate-950">
              Researcher
            </Link>
            <Link
              href="/internal/researcher/item-bank"
              className="hover:text-slate-950"
            >
              Item bank
            </Link>
            <Link
              href="/internal/admin/sessions"
              className="hover:text-slate-950"
            >
              Sessions
            </Link>
            <Link
              href="/internal/admin/exports"
              className="hover:text-slate-950"
            >
              Exports
            </Link>
          </nav>
        </div>
      </header>

      <InternalAccessBoundary>
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </InternalAccessBoundary>
    </div>
  );
}
