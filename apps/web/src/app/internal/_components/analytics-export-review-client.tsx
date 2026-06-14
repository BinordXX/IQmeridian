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
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Requested</p>
          <p className="mt-3 text-3xl font-semibold">
            {countByStatus(requests, 'REQUESTED')}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Approved</p>
          <p className="mt-3 text-3xl font-semibold">
            {countByStatus(requests, 'APPROVED')}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Declined</p>
          <p className="mt-3 text-3xl font-semibold">
            {countByStatus(requests, 'DECLINED')}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Generated</p>
          <p className="mt-3 text-3xl font-semibold">
            {countByStatus(requests, 'GENERATED')}
          </p>
        </article>
      </section>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Export approval queue</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Researchers can request export datasets. Platform admins approve,
          decline, and generate approved requests here. Generated records
          currently create a durable file key; physical file materialisation can
          be added in the export-processing step.
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
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {request.status}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">
                      {definition?.label ?? request.dataset}
                    </h3>
                    <p className="mt-2 max-w-3xl leading-6 text-slate-600">
                      {definition?.description ??
                        'No export definition description is available.'}
                    </p>
                  </div>

                  <span className="w-fit rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold">
                    {request.format}
                  </span>
                </div>

                <dl className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl bg-white px-4 py-3">
                    <dt className="text-xs font-medium text-slate-500">
                      Requested by
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {request.requestedBy}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-white px-4 py-3">
                    <dt className="text-xs font-medium text-slate-500">
                      Requested role
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {request.requestedRole ?? 'Unknown'}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-white px-4 py-3">
                    <dt className="text-xs font-medium text-slate-500">
                      Date range
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {request.dateFrom?.slice(0, 10) ?? '—'} to{' '}
                      {request.dateTo?.slice(0, 10) ?? '—'}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-white px-4 py-3">
                    <dt className="text-xs font-medium text-slate-500">
                      Requested at
                    </dt>
                    <dd className="mt-1 font-semibold">
                      {formatDateTime(request.createdAt)}
                    </dd>
                  </div>
                </dl>

                {request.requestReason ? (
                  <p className="mt-4 rounded-xl bg-white px-4 py-3 leading-6 text-slate-700">
                    <span className="font-semibold">Request reason:</span>{' '}
                    {request.requestReason}
                  </p>
                ) : null}

                {!isRequested ? (
                  <div className="mt-4 rounded-xl bg-white px-4 py-3 leading-6 text-slate-700">
                    <p>
                      <span className="font-semibold">Review decision:</span>{' '}
                      {request.reviewDecision ?? request.status}
                    </p>
                    <p className="mt-1">
                      <span className="font-semibold">Review reason:</span>{' '}
                      {request.reviewReason ?? '—'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Reviewed at {formatDateTime(request.reviewedAt)}
                    </p>
                  </div>
                ) : null}

                {isGenerated ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 leading-6 text-emerald-800">
                    <p>
                      <span className="font-semibold">Generated at:</span>{' '}
                      {formatDateTime(request.generatedAt)}
                    </p>
                    <p className="mt-1 break-all">
                      <span className="font-semibold">File key:</span>{' '}
                      {request.fileKey ?? '—'}
                    </p>

                    <a
                      href={`/internal/api/exports/requests/${encodeURIComponent(
                        request.id
                      )}/download`}
                      className="mt-3 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Download export
                    </a>
                  </div>
                ) : null}

                {isRequested ? (
                  <div className="mt-5 space-y-3">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
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
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                        placeholder="Required when declining. Optional but recommended when approving."
                      />
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => void handleReview(request, 'APPROVED')}
                        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        {isSubmitting ? 'Reviewing...' : 'Approve'}
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => void handleReview(request, 'DECLINED')}
                        className="rounded-full border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:text-red-300"
                      >
                        {isSubmitting ? 'Reviewing...' : 'Decline'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {isApproved ? (
                  <div className="mt-5 space-y-3">
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
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
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                        placeholder="Optional generation note for audit context."
                      />
                    </label>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleGenerate(request)}
                      className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
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
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            No export requests have been created yet.
          </p>
        ) : null}
      </section>
    </section>
  );
}
