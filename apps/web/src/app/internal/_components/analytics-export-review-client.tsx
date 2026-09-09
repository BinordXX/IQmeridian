'use client';

import { useMemo, useState } from 'react';

import {
  generateAnalyticsExportRequest,
  reviewAnalyticsExportRequest,
  type AnalyticsExportDefinition,
  type InternalAnalyticsExportRequestOutput,
} from '../_lib/internal-api';

function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

function countByStatus(
  requests: InternalAnalyticsExportRequestOutput[],
  status: InternalAnalyticsExportRequestOutput['status']
) {
  return requests.filter((request) => request.status === status).length;
}

function getStatusClassName(
  status: InternalAnalyticsExportRequestOutput['status']
) {
  if (status === 'GENERATED') {
    return 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100';
  }

  if (status === 'APPROVED') {
    return 'border-blue-300/20 bg-blue-400/10 text-blue-100';
  }

  if (status === 'DECLINED' || status === 'FAILED' || status === 'CANCELLED') {
    return 'border-red-300/20 bg-red-400/10 text-red-100';
  }

  if (status === 'GENERATING') {
    return 'border-white/10 bg-[#020817]/70 text-slate-300';
  }

  return 'border-amber-300/20 bg-amber-400/10 text-amber-100';
}

function ExportReviewMetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </article>
  );
}

export function AnalyticsExportReviewClient({
  definitions,
  initialRequests,
}: {
  definitions: AnalyticsExportDefinition[];
  initialRequests: InternalAnalyticsExportRequestOutput[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [reviewReasons, setReviewReasons] = useState<Record<string, string>>(
    {}
  );
  const [generationReasons, setGenerationReasons] = useState<
    Record<string, string>
  >({});
  const [submittingRequestId, setSubmittingRequestId] = useState<string | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const definitionsByDataset = useMemo(() => {
    return new Map<string, AnalyticsExportDefinition>(
      definitions.map((definition) => [definition.dataset, definition])
    );
  }, [definitions]);

  async function handleReview(
    request: InternalAnalyticsExportRequestOutput,
    decision: 'APPROVED' | 'DECLINED'
  ) {
    setSubmittingRequestId(request.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedRequest = await reviewAnalyticsExportRequest(request.id, {
        decision,
        reviewReason: reviewReasons[request.id] ?? null,
      });

      setRequests((currentRequests) =>
        currentRequests.map((currentRequest) =>
          currentRequest.id === updatedRequest.id
            ? updatedRequest
            : currentRequest
        )
      );

      setSuccessMessage(
        `Export request ${updatedRequest.id} was ${updatedRequest.status.toLowerCase()}.`
      );

      setReviewReasons((currentReasons) => ({
        ...currentReasons,
        [request.id]: '',
      }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Export request could not be reviewed.'
      );
    } finally {
      setSubmittingRequestId(null);
    }
  }

  async function handleGenerate(request: InternalAnalyticsExportRequestOutput) {
    setSubmittingRequestId(request.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedRequest = await generateAnalyticsExportRequest(request.id, {
        generationReason: generationReasons[request.id] ?? null,
      });

      setRequests((currentRequests) =>
        currentRequests.map((currentRequest) =>
          currentRequest.id === updatedRequest.id
            ? updatedRequest
            : currentRequest
        )
      );

      setSuccessMessage(
        `Export request ${updatedRequest.id} was generated. File key: ${
          updatedRequest.fileKey ?? 'not available'
        }.`
      );

      setGenerationReasons((currentReasons) => ({
        ...currentReasons,
        [request.id]: '',
      }));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Export request could not be generated.'
      );
    } finally {
      setSubmittingRequestId(null);
    }
  }

  return (
    <section className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ExportReviewMetricCard
          label="Requested"
          value={countByStatus(requests, 'REQUESTED')}
        />
        <ExportReviewMetricCard
          label="Approved"
          value={countByStatus(requests, 'APPROVED')}
        />
        <ExportReviewMetricCard
          label="Declined"
          value={countByStatus(requests, 'DECLINED')}
        />
        <ExportReviewMetricCard
          label="Generated"
          value={countByStatus(requests, 'GENERATED')}
        />
      </section>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold leading-7 text-red-100">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold leading-7 text-emerald-100">
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <h2 className="text-lg font-black text-white">Export approval queue</h2>

        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
          Researchers can request export datasets. Platform admins approve,
          decline, and generate approved requests here. Generated records create
          a durable file key and expose the approved download action.
        </p>

        <div className="mt-6 space-y-4">
          {requests.map((request) => {
            const definition = definitionsByDataset.get(request.dataset);
            const isRequested = request.status === 'REQUESTED';
            const isApproved = request.status === 'APPROVED';
            const isGenerated = request.status === 'GENERATED';
            const isSubmitting = submittingRequestId === request.id;

            return (
              <article
                key={request.id}
                className="rounded-[1.5rem] border border-white/10 bg-[#020817]/70 p-5 text-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p
                      className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${getStatusClassName(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </p>

                    <h3 className="mt-3 text-lg font-black text-white">
                      {definition?.label ?? request.dataset}
                    </h3>

                    <p className="mt-2 max-w-3xl leading-7 text-slate-400">
                      {definition?.description ??
                        'No export definition description is available.'}
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-white/10 bg-[#07142f]/80 px-3 py-1 text-xs font-bold text-slate-300">
                    {request.format}
                  </span>
                </div>

                <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                    <dt className="text-xs font-bold text-slate-500">
                      Requested by
                    </dt>
                    <dd className="mt-1 break-all font-black text-white">
                      {request.requestedBy}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                    <dt className="text-xs font-bold text-slate-500">
                      Requested role
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {request.requestedRole ?? 'Unknown'}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                    <dt className="text-xs font-bold text-slate-500">
                      Date range
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {request.dateFrom?.slice(0, 10) ?? '—'} to{' '}
                      {request.dateTo?.slice(0, 10) ?? '—'}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                    <dt className="text-xs font-bold text-slate-500">
                      Requested at
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {formatDateTime(request.createdAt)}
                    </dd>
                  </div>
                </dl>

                {request.requestReason ? (
                  <p className="mt-4 rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3 leading-7 text-slate-300">
                    <span className="font-black text-white">
                      Request reason:
                    </span>{' '}
                    {request.requestReason}
                  </p>
                ) : null}

                {!isRequested ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3 leading-7 text-slate-300">
                    <p>
                      <span className="font-black text-white">
                        Review decision:
                      </span>{' '}
                      {request.reviewDecision ?? request.status}
                    </p>

                    <p className="mt-1">
                      <span className="font-black text-white">
                        Review reason:
                      </span>{' '}
                      {request.reviewReason ?? '—'}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Reviewed at {formatDateTime(request.reviewedAt)}
                    </p>
                  </div>
                ) : null}

                {isGenerated ? (
                  <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 leading-7 text-emerald-100">
                    <p>
                      <span className="font-black">Generated at:</span>{' '}
                      {formatDateTime(request.generatedAt)}
                    </p>

                    <p className="mt-1 break-all">
                      <span className="font-black">File key:</span>{' '}
                      {request.fileKey ?? '—'}
                    </p>

                    <a
                      href={`/internal/api/exports/requests/${encodeURIComponent(
                        request.id
                      )}/download`}
                      className="mt-3 inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
                    >
                      Download export
                    </a>
                  </div>
                ) : null}

                {isRequested ? (
                  <div className="mt-5 space-y-3">
                    <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
                      Review reason
                      <textarea
                        value={reviewReasons[request.id] ?? ''}
                        onChange={(event) =>
                          setReviewReasons((currentReasons) => ({
                            ...currentReasons,
                            [request.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        className="rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
                        placeholder="Required when declining. Optional but recommended when approving."
                      />
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => void handleReview(request, 'APPROVED')}
                        className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmitting ? 'Reviewing...' : 'Approve'}
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => void handleReview(request, 'DECLINED')}
                        className="rounded-full border border-red-300/25 bg-red-400/10 px-4 py-2 text-sm font-black text-red-100 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmitting ? 'Reviewing...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {isApproved ? (
                  <div className="mt-5 space-y-3">
                    <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
                      Generation reason
                      <textarea
                        value={generationReasons[request.id] ?? ''}
                        onChange={(event) =>
                          setGenerationReasons((currentReasons) => ({
                            ...currentReasons,
                            [request.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        className="rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
                        placeholder="Optional generation note for audit context."
                      />
                    </label>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleGenerate(request)}
                      className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? 'Generating...' : 'Generate export'}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>

        {requests.length === 0 ? (
          <p className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-500">
            No export requests have been created yet.
          </p>
        ) : null}
      </section>
    </section>
  );
}
