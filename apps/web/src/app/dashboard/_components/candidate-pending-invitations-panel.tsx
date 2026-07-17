import { AlertTriangle, MailCheck, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import type { CandidatePendingInvitationSummary } from '../candidate-dashboard-api';

const formatDate = (value?: string | null) => {
  if (!value) return 'No expiry shown';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'No expiry shown';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
};

const getInvitationTitle = (invitation: CandidatePendingInvitationSummary) => {
  return (
    invitation.campaign?.assessmentForm?.name ??
    invitation.campaign?.name ??
    'IQMeridian assessment invitation'
  );
};

const getOrganisationName = (invitation: CandidatePendingInvitationSummary) => {
  return invitation.campaign?.organisation?.name ?? 'Inviting organisation';
};

const getInvitationHref = (token: string) => {
  return `/assessment/invitation/${encodeURIComponent(token)}/instructions`;
};

type CandidatePendingInvitationsPanelProps = {
  invitations: CandidatePendingInvitationSummary[];
  errorMessage?: string | null;
};

export function CandidatePendingInvitationsPanel({
  invitations,
  errorMessage = null,
}: CandidatePendingInvitationsPanelProps) {
  if (errorMessage) {
    return (
      <section className="rounded-[2rem] border border-amber-300/20 bg-amber-400/10 p-5 text-amber-100">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 shrink-0" size={18} />
          <div>
            <h2 className="font-black">Pending invitations unavailable</h2>
            <p className="mt-1 text-sm leading-6 text-amber-100/80">
              {errorMessage}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(59,130,246,0.12),transparent_28%)]"
      />

      <div className="relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
              <MailCheck size={22} strokeWidth={2} />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                Pending invitations
              </p>

              <h2 className="mt-2 text-2xl font-black text-white">
                You have assessment invitation
                {invitations.length === 1 ? '' : 's'} waiting
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                These invitations match your candidate email address. Open an
                invitation to claim it and create your assessment session.
              </p>
            </div>
          </div>

          <span className="w-fit rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-100">
            {invitations.length} pending
          </span>
        </div>

        <div className="mt-6 grid gap-3">
          {invitations.map((invitation) => (
            <article
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
              key={invitation.id}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-black text-white">
                    {getInvitationTitle(invitation)}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    {getOrganisationName(invitation)}
                  </p>

                  <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <dt className="font-bold uppercase tracking-[0.16em] text-slate-500">
                        Status
                      </dt>
                      <dd className="mt-1 font-black text-cyan-100">
                        {invitation.status}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-bold uppercase tracking-[0.16em] text-slate-500">
                        Expires
                      </dt>
                      <dd className="mt-1 font-black text-slate-200">
                        {formatDate(invitation.expiresAt)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <Link
                  className="inline-flex w-fit items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
                  href={getInvitationHref(invitation.token)}
                >
                  Open invitation
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100">
          <div className="flex gap-2">
            <ShieldCheck className="mt-0.5 shrink-0" size={16} />
            <p>
              IQMeridian will bind the invitation to this account only after
              your email is verified against the invitation record.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
