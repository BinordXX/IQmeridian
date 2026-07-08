import { ArrowLeft, Building2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { getApiBaseUrl } from '@/lib/api-url';

import { EmployerAdminInvitationAcceptanceForm } from './employer-admin-invitation-acceptance-form';

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

type EmployerAdminInvitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  organisation: {
    id: string;
    name: string;
  };
};

const getErrorMessage = (payload: {
  message?: string | string[];
  error?: string;
}) => {
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ');
  }

  return payload.message ?? payload.error ?? 'Unable to load invitation.';
};

const formatDateTime = (value: string) => {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const getInvitation = async (token: string) => {
  const response = await fetch(
    `${getApiBaseUrl()}/auth/organisation-admin-invitations/${encodeURIComponent(
      token,
    )}`,
    {
      cache: 'no-store',
    },
  );

  const payload = (await response.json().catch(() => ({}))) as
    | EmployerAdminInvitation
    | {
        message?: string | string[];
        error?: string;
      };

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        payload as {
          message?: string | string[];
          error?: string;
        },
      ),
    );
  }

  return payload as EmployerAdminInvitation;
};

export default async function EmployerAdminInvitationPage({
  params,
}: PageProps) {
  const { token } = await params;

  let invitation: EmployerAdminInvitation | null = null;
  let errorMessage: string | null = null;

  try {
    invitation = await getInvitation(token);
  } catch (error) {
    errorMessage =
      error instanceof Error ? error.message : 'Unable to load invitation.';
  }

  const isPending = invitation?.status === 'PENDING';

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] px-6 py-10 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(2,8,23,1))]"
      />

      <div className="relative mx-auto max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-cyan-200"
            href="/"
          >
            <ArrowLeft size={16} strokeWidth={2.3} />
            Back to IQMeridian
          </Link>

          <Link
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-white/[0.07]"
            href="/login"
          >
            Sign in
          </Link>
        </header>

        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
          />

          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                IQMeridian employer onboarding
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
                Employer-admin invitation
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
                Complete this invitation to create the first employer-admin
                account for an approved organisation.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
              <Building2 size={25} strokeWidth={2.2} />
            </div>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-[2rem] border border-red-300/20 bg-red-400/10 p-8">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-red-200">
              Invitation unavailable
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
              This employer-admin invitation could not be loaded.
            </h2>

            <p className="mt-4 text-sm leading-6 text-red-100/80">
              {errorMessage}
            </p>

            <Link
              className="mt-6 inline-flex rounded-2xl border border-red-300/20 bg-red-400/10 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-400/15"
              href="/login"
            >
              Go to sign in
            </Link>
          </section>
        ) : null}

        {invitation && !isPending ? (
          <section className="rounded-[2rem] border border-amber-300/20 bg-amber-400/10 p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-100">
                <ShieldCheck size={22} strokeWidth={2.2} />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
                  Invitation status
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
                  This invitation is {invitation.status.toLowerCase()}.
                </h2>

                <p className="mt-4 text-sm leading-6 text-amber-100/80">
                  The invitation for {invitation.email} at{' '}
                  {invitation.organisation.name} is no longer available for
                  account creation.
                </p>

                <p className="mt-2 text-sm leading-6 text-amber-100/80">
                  Expires: {formatDateTime(invitation.expiresAt)}
                </p>

                <Link
                  className="mt-6 inline-flex rounded-2xl border border-amber-300/20 bg-amber-400/10 px-5 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/15"
                  href="/login"
                >
                  Go to sign in
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {invitation && isPending ? (
          <EmployerAdminInvitationAcceptanceForm
            invitation={invitation}
            token={token}
          />
        ) : null}
      </div>
    </main>
  );
}