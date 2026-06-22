import Link from 'next/link';
import type { ReactNode } from 'react';

import { requireInternalStaff } from '@/lib/route-guards';

type InternalLayoutProps = {
  children: ReactNode;
};

export default async function InternalLayout({
  children,
}: InternalLayoutProps) {
  const { session, role } = await requireInternalStaff('/internal');

  const isPlatformAdmin = role === 'PLATFORM_ADMIN';
  const canUseResearcherTools =
    role === 'PLATFORM_ADMIN' || role === 'RESEARCHER';

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
            <p className="mt-1 text-xs text-slate-500">
              Signed in as {session.user.email} · {role}
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/internal" className="hover:text-slate-950">
              Overview
            </Link>

            {isPlatformAdmin ? (
              <>
                <Link href="/internal/admin" className="hover:text-slate-950">
                  Platform admin
                </Link>
                <Link
                  href="/internal/admin/users"
                  className="hover:text-slate-950"
                >
                  Users
                </Link>
                
                <Link
                  href="/internal/admin/organisations"
                  className="hover:text-slate-950"
                >
                  Organisations
                </Link>
                <Link
                  href="/internal/admin/reports"
                  className="hover:text-slate-950"
                >
                  Reports
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
                  Export governance
                </Link>
                <Link
                  href="/internal/admin/consumer-assessment"
                  className="hover:text-slate-950"
                >
                  Consumer assessment
                </Link>
              </>
            ) : null}

            {canUseResearcherTools ? (
              <>
                <Link
                  href="/internal/researcher"
                  className="hover:text-slate-950"
                >
                  Researcher
                </Link>
                <Link
                  href="/internal/researcher/item-bank"
                  className="hover:text-slate-950"
                >
                  Item bank
                </Link>
                <Link
                  href="/internal/researcher/pilot-forms"
                  className="hover:text-slate-950"
                >
                  Pilot forms
                </Link>
                <Link
                  href="/internal/researcher/exports"
                  className="hover:text-slate-950"
                >
                  Export requests
                </Link>
              </>
            ) : null}

            <Link href="/logout" className="hover:text-slate-950">
              Sign out
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}
