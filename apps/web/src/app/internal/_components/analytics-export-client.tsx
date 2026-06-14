'use client';

import { useMemo, useState } from 'react';

import {
  requestAnalyticsExport,
  type AnalyticsExportDataset,
  type AnalyticsExportDefinition,
  type InternalAnalyticsExportGovernanceSettingOutput,
  type InternalAnalyticsExportRequestOutput,
} from '../_lib/internal-api';

function formatDateTime(value: string | null) {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
}

function formatDate(value: string | null) {
  if (!value) {
    return '—';
  }

  return value.slice(0, 10);
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
    return 'bg-emerald-100 text-emerald-900';
  }

  if (status === 'APPROVED') {
    return 'bg-blue-100 text-blue-900';
  }

  if (status === 'DECLINED' || status === 'FAILED' || status === 'CANCELLED') {
    return 'bg-red-100 text-red-900';
  }

  if (status === 'GENERATING') {
    return 'bg-slate-200 text-slate-900';
  }

  return 'bg-amber-100 text-amber-900';
}

export function AnalyticsExportClient({
  definitions,
  initialRequests = [],
  governanceSetting,
}: {
  definitions: AnalyticsExportDefinition[];
  initialRequests?: InternalAnalyticsExportRequestOutput[];
  governanceSetting?: InternalAnalyticsExportGovernanceSettingOutput;
}) {
  const [selectedDataset, setSelectedDataset] =
    useState<AnalyticsExportDataset>(definitions[0]?.dataset ?? 'ITEM_LEVEL');
  const [dateFrom, setDateFrom] = useState('2026-06-01');
  const [dateTo, setDateTo] = useState('2026-06-06');
  const [requestReason, setRequestReason] = useState(
    'Psychometric readiness review'
  );
  const [requests, setRequests] = useState(initialRequests);
  const [requestedEvent, setRequestedEvent] =
    useState<InternalAnalyticsExportRequestOutput | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAutoApprovalEnabled = governanceSetting?.approvalRequired === false;

  const selectedDefinition = definitions.find(
    (definition) => definition.dataset === selectedDataset
  );

  const definitionsByDataset = useMemo(() => {
    return new Map<string, AnalyticsExportDefinition>(
      definitions.map((definition) => [definition.dataset, definition])
    );
  }, [definitions]);

  async function handleRequestExport() {
    if (!selectedDefinition) {
      return;
    }

    setIsSubmitting(true);
    setRequestedEvent(null);
    setErrorMessage('');

    try {
      const event = await requestAnalyticsExport({
        dataset: selectedDefinition.dataset,
        dateFrom,
        dateTo,
        format: selectedDefinition.format,
        requestReason,
      });

      setRequestedEvent(event);
      setRequests((currentRequests) => [event, ...currentRequests]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Analytics export request could not be recorded.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Request analytics export
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Export definitions come from the internal API.{' '}
              {isAutoApprovalEnabled
                ? 'Current governance mode allows researcher export requests to be automatically approved and generated.'
                : 'Requests are stored as durable export-request records and must be approved before generation and download.'}
            </p>
          </div>

          <span
            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
              isAutoApprovalEnabled
                ? 'bg-emerald-100 text-emerald-900'
                : 'bg-amber-100 text-amber-900'
            }`}
          >
            {isAutoApprovalEnabled
              ? 'Auto-approval enabled'
              : 'Admin approval required'}
          </span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Export dataset
            <select
              value={selectedDataset}
              onChange={(event) => {
                setSelectedDataset(
                  event.target.value as AnalyticsExportDataset
                );
                setRequestedEvent(null);
                setErrorMessage('');
              }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            >
              {definitions.map((definition) => (
                <option key={definition.dataset} value={definition.dataset}>
                  {definition.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Date from
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setRequestedEvent(null);
                setErrorMessage('');
              }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Date to
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setRequestedEvent(null);
                setErrorMessage('');
              }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-700">
          Request reason
          <textarea
            value={requestReason}
            onChange={(event) => {
              setRequestReason(event.target.value);
              setRequestedEvent(null);
              setErrorMessage('');
            }}
            rows={3}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
            placeholder="Explain why this export is needed."
          />
        </label>

        {selectedDefinition ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">
              {selectedDefinition.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {selectedDefinition.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold">
                Format: {selectedDefinition.format}
              </span>
              <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold">
                {selectedDefinition.currentlyAvailable
                  ? 'Available'
                  : 'Pending backend wiring'}
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!selectedDefinition?.currentlyAvailable || isSubmitting}
            onClick={() => void handleRequestExport()}
            className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting
              ? 'Processing export...'
              : isAutoApprovalEnabled
                ? 'Generate export'
                : 'Submit export request'}
          </button>

          <button
            type="button"
            onClick={() => {
              setRequestedEvent(null);
              setErrorMessage('');
            }}
            className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
          >
            Clear message
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {requestedEvent && selectedDefinition ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
            Export request recorded for {selectedDefinition.label}. Current
            status:{' '}
            <span className="font-semibold">{requestedEvent.status}</span>.
            {requestedEvent.status === 'GENERATED'
              ? ' The export is ready to download from your request history below.'
              : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Requested</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {countByStatus(requests, 'REQUESTED')}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Approved</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {countByStatus(requests, 'APPROVED')}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Declined</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {countByStatus(requests, 'DECLINED')}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Generated</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {countByStatus(requests, 'GENERATED')}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Failed</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {countByStatus(requests, 'FAILED')}
          </p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">
          My export request history
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Track review status and download generated exports after platform
          admin approval, or immediately when auto-approval is enabled.
        </p>

        <div className="mt-6 space-y-4">
          {requests.map((request) => {
            const definition = definitionsByDataset.get(request.dataset);
            const isGenerated = request.status === 'GENERATED';

            return (
              <article
                key={request.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(
                        request.status
                      )}`}
                    >
                      {request.status}
                    </p>

                    <h3 className="mt-3 text-lg font-semibold text-slate-950">
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
                      Date range
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {formatDate(request.dateFrom)} to{' '}
                      {formatDate(request.dateTo)}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-white px-4 py-3">
                    <dt className="text-xs font-medium text-slate-500">
                      Requested at
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {formatDateTime(request.createdAt)}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-white px-4 py-3">
                    <dt className="text-xs font-medium text-slate-500">
                      Reviewed at
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {formatDateTime(request.reviewedAt)}
                    </dd>
                  </div>

                  <div className="rounded-xl bg-white px-4 py-3">
                    <dt className="text-xs font-medium text-slate-500">
                      Generated at
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-950">
                      {formatDateTime(request.generatedAt)}
                    </dd>
                  </div>
                </dl>

                {request.requestReason ? (
                  <p className="mt-4 rounded-xl bg-white px-4 py-3 leading-6 text-slate-700">
                    <span className="font-semibold">Request reason:</span>{' '}
                    {request.requestReason}
                  </p>
                ) : null}

                {request.reviewReason ? (
                  <p className="mt-4 rounded-xl bg-white px-4 py-3 leading-6 text-slate-700">
                    <span className="font-semibold">Review reason:</span>{' '}
                    {request.reviewReason}
                  </p>
                ) : null}

                {isGenerated ? (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 leading-6 text-emerald-800">
                    <p>
                      This export has been generated and is ready to download.
                    </p>
                    <a
                      href={`/internal/api/researcher/exports/requests/${encodeURIComponent(
                        request.id
                      )}/download`}
                      className="mt-3 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Download export
                    </a>
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
