import Link from 'next/link';

import { getApiBaseUrl } from '@/lib/api-url';
import { getRequiredServerApiAuthHeaders } from '@/lib/server-api-auth';

import { OrganisationAccessRequestConvertButton } from './_components/organisation-access-request-convert-button';
import { OrganisationAccessRequestReviewForm } from './_components/organisation-access-request-review-form';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  status?: string;
}>;

type ReviewedBy = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

type OrganisationAdminInvitation = {
  id: string;
  email: string;
  token: string;
  role: string;
  status: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
};

type OrganisationAccessRequest = {
  id: string;
  organisationName: string;
  website: string | null;
  industry: string | null;
  country: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  intendedUse: string;
  expectedVolume: string | null;
  status: string;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewNotes: string | null;
  convertedOrganisationId: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedBy: ReviewedBy | null;
  adminInvitation: OrganisationAdminInvitation | null;
};

const statusFilters = [
  {
    label: 'All',
    href: '/internal/admin/organisation-access-requests',
    value: null,
  },
  {
    label: 'Pending',
    href: '/internal/admin/organisation-access-requests?status=PENDING',
    value: 'PENDING',
  },
  {
    label: 'Approved',
    href: '/internal/admin/organisation-access-requests?status=APPROVED',
    value: 'APPROVED',
  },
  {
    label: 'Declined',
    href: '/internal/admin/organisation-access-requests?status=DECLINED',
    value: 'DECLINED',
  },
  {
    label: 'Converted',
    href: '/internal/admin/organisation-access-requests?status=CONVERTED',
    value: 'CONVERTED',
  },
];

const getStatusClassName = (status: string) => {
  if (status === 'PENDING') {
    return 'border-amber-300/20 bg-amber-400/10 text-amber-100';
  }

  if (status === 'APPROVED') {
    return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
  }

  if (status === 'DECLINED') {
    return 'border-red-300/20 bg-red-400/10 text-red-100';
  }

  if (status === 'CONVERTED') {
    return 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100';
  }

  return 'border-white/10 bg-white/[0.04] text-slate-200';
};

const formatDateTime = (value: string | null) => {
  if (!value) {
    return 'Not recorded';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const getOrganisationAccessRequests = async (status?: string) => {
  const authHeaders = await getRequiredServerApiAuthHeaders();

  const requestUrl = new URL(
    `${getApiBaseUrl()}/organisation-access-requests`,
  );

  if (status) {
    requestUrl.searchParams.set('status', status);
  }

  const response = await fetch(requestUrl.toString(), {
    headers: authHeaders,
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
      error?: string;
    };

    const message = Array.isArray(payload.message)
      ? payload.message.join(' ')
      : payload.message ??
        payload.error ??
        'Unable to load organisation access requests.';

    throw new Error(message);
  }

  return (await response.json()) as OrganisationAccessRequest[];
};

export default async function OrganisationAccessRequestsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const resolvedSearchParams = await searchParams;
  const selectedStatus = resolvedSearchParams.status;

  let requests: OrganisationAccessRequest[] = [];
  let errorMessage: string | null = null;

  try {
    requests = await getOrganisationAccessRequests(selectedStatus);
  } catch (error) {
    errorMessage =
      error instanceof Error
        ? error.message
        : 'Unable to load organisation access requests.';
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
        />

        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Platform admin
          </p>

          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">
            Organisation access requests
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
            Review public employer onboarding requests before an organisation is
            provisioned. Approval does not yet create an organisation; conversion
            is handled in the next provisioning step.
          </p>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        {statusFilters.map((filter) => {
          const isActive =
            filter.value === null
              ? !selectedStatus
              : selectedStatus === filter.value;

          return (
            <Link
              className={[
                'rounded-full border px-4 py-2 text-sm font-black transition',
                isActive
                  ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100'
                  : 'border-white/10 bg-white/[0.035] text-slate-400 hover:bg-white/[0.06] hover:text-white',
              ].join(' ')}
              href={filter.href}
              key={filter.label}
            >
              {filter.label}
            </Link>
          );
        })}
      </section>

      {errorMessage ? (
        <section className="rounded-[2rem] border border-red-300/20 bg-red-400/10 p-5 text-sm font-bold leading-6 text-red-100">
          {errorMessage}
        </section>
      ) : null}

      <section className="grid gap-5">
        {requests.length > 0 ? (
          requests.map((request) => (
            <article
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#07142f]/88 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
              key={request.id}
            >
              <div className="border-b border-white/10 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-black text-white">
                        {request.organisationName}
                      </h2>

                      <span
                        className={[
                          'inline-flex rounded-full border px-3 py-1 text-xs font-black',
                          getStatusClassName(request.status),
                        ].join(' ')}
                      >
                        {request.status}
                      </span>
                    </div>

                    <p className="mt-2 break-all font-mono text-xs text-slate-600">
                      {request.id}
                    </p>
                  </div>

                  <div className="text-sm leading-6 text-slate-400 lg:text-right">
                    <p>
                      Submitted:{' '}
                      <span className="font-bold text-slate-200">
                        {formatDateTime(request.createdAt)}
                      </span>
                    </p>
                    <p>
                      Reviewed:{' '}
                      <span className="font-bold text-slate-200">
                        {formatDateTime(request.reviewedAt)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 xl:grid-cols-[1fr_0.78fr]">
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Contact
                      </p>
                      <p className="mt-2 text-sm font-black text-white">
                        {request.contactName}
                      </p>
                      <p className="mt-1 break-all text-sm text-cyan-200">
                        {request.contactEmail}
                      </p>
                      {request.contactPhone ? (
                        <p className="mt-1 text-sm text-slate-400">
                          {request.contactPhone}
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Organisation context
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Industry:{' '}
                        <span className="font-bold text-white">
                          {request.industry ?? 'Not supplied'}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Country:{' '}
                        <span className="font-bold text-white">
                          {request.country ?? 'Not supplied'}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        Volume:{' '}
                        <span className="font-bold text-white">
                          {request.expectedVolume ?? 'Not supplied'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {request.website ? (
                    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                        Website
                      </p>
                      <a
                        className="mt-2 block break-all text-sm font-bold text-cyan-200 hover:text-cyan-100"
                        href={request.website}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {request.website}
                      </a>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Intended use
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-300">
                      {request.intendedUse}
                    </p>
                  </div>
                </div>

                <aside className="space-y-5">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Review record
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Reviewer:{' '}
                      <span className="font-bold text-white">
                        {request.reviewedBy?.name ??
                          request.reviewedBy?.email ??
                          'Not reviewed'}
                      </span>
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Notes:{' '}
                      <span className="font-bold text-white">
                        {request.reviewNotes ?? 'No notes'}
                      </span>
                    </p>

                    {request.convertedOrganisationId ? (
                      <p className="mt-1 break-all text-sm leading-6 text-slate-300">
                        Converted organisation:{' '}
                        <span className="font-mono text-cyan-200">
                          {request.convertedOrganisationId}
                        </span>
                      </p>
                    ) : null}

                    {request.adminInvitation ? (
  <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
      Employer-admin invitation
    </p>

    <p className="mt-2 break-all text-sm leading-6 text-cyan-100">
      Email:{' '}
      <span className="font-bold">{request.adminInvitation.email}</span>
    </p>

    <p className="mt-1 text-sm leading-6 text-cyan-100">
      Status:{' '}
      <span className="font-bold">{request.adminInvitation.status}</span>
    </p>

    <p className="mt-1 text-sm leading-6 text-cyan-100">
      Expires:{' '}
      <span className="font-bold">
        {formatDateTime(request.adminInvitation.expiresAt)}
      </span>
    </p>

    <p className="mt-3 break-all font-mono text-xs leading-6 text-cyan-100/75">
  Token: {request.adminInvitation.token}
</p>

<Link
  className="mt-4 inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15"
  href={`/employer-admin-invitations/${encodeURIComponent(
    request.adminInvitation.token,
  )}`}
  target="_blank"
>
  Open invitation acceptance page
</Link>
  </div>
) : null}

                  </div>

                  <OrganisationAccessRequestReviewForm
                    currentStatus={request.status}
                    requestId={request.id}
                  />
                  <OrganisationAccessRequestConvertButton
  convertedOrganisationId={request.convertedOrganisationId}
  requestId={request.id}
  status={request.status}
/>
                </aside>
              </div>
            </article>
          ))
        ) : (
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/88 p-10 text-center">
            <p className="text-sm font-bold text-slate-400">
              No organisation access requests found for this filter.
            </p>
          </section>
        )}
      </section>
    </div>
  );
}