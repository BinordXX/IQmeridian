'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  canAccessInternalSurface,
  getCurrentInternalRole,
  getInternalSurfaceForPath,
  internalRoleLabels,
} from '../_lib/internal-access-control';

export function InternalAccessBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentRole = getCurrentInternalRole();
  const surface = getInternalSurfaceForPath(pathname);

  const isAuthorised = canAccessInternalSurface({
    role: currentRole,
    surface,
  });

  if (!isAuthorised) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Access restricted
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Internal tooling access denied
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This internal surface exposes sensitive platform, assessment,
            session, or analytics information. The current role is{' '}
            <span className="font-semibold">
              {internalRoleLabels[currentRole]}
            </span>
            , which is not authorised for this route.
          </p>

          <Link
            href="/internal"
            className="mt-6 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Return to internal dashboard
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
