import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireAnyRole } from '@/lib/route-guards';
import { requireEmployerAdmin } from '@/lib/route-guards';

type EmployerLayoutProps = {
  children: ReactNode;
};

export default async function EmployerLayout({
  children,
}: EmployerLayoutProps) {
  await requireEmployerAdmin('/employer/dashboard');
  const session = await requireAnyRole(['EMPLOYER_ADMIN'], '/employer');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              IQMeridian Employer Workspace
            </p>
            <h1 className="mt-1 text-xl font-bold text-slate-950">
              Campaigns and reporting
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Signed in as {session.user.email} · {session.user.role}
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/employer/dashboard" className="hover:text-slate-950">
              Dashboard
            </Link>
            <Link href="/employer/campaigns" className="hover:text-slate-950">
              Campaigns
            </Link>
            <Link href="/employer/candidates" className="hover:text-slate-950">
              Candidate statuses
            </Link>
            <Link href="/employer/results" className="hover:text-slate-950">
              Results
            </Link>
            <Link href="/employer/exports" className="hover:text-slate-950">
              Exports
            </Link>
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
