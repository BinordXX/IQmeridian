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

function ExportMetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-[#07142f]/90 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </article>
  );
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
      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-black text-white">
              Request analytics export
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
              Export definitions come from the internal API.{' '}
              {isAutoApprovalEnabled
                ? 'Current governance mode allows researcher export requests to be automatically approved and generated.'
                : 'Requests are stored as durable export-request records and must be approved before generation and download.'}
            </p>
          </div>

          <span
            className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${
              isAutoApprovalEnabled
                ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                : 'border-amber-300/20 bg-amber-400/10 text-amber-100'
            }`}
          >
            {isAutoApprovalEnabled
              ? 'Auto-approval enabled'
              : 'Admin approval required'}
          </span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
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
              className="min-h-12 rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
            >
              {definitions.map((definition) => (
                <option key={definition.dataset} value={definition.dataset}>
                  {definition.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
            Date from
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value);
                setRequestedEvent(null);
                setErrorMessage('');
              }}
              className="min-h-12 rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
            Date to
            <input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
                setRequestedEvent(null);
                setErrorMessage('');
              }}
              className="min-h-12 rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
            />
          </label>
        </div>

        <label className="mt-4 flex flex-col gap-2 text-sm font-bold text-slate-300">
          Request reason
          <textarea
            value={requestReason}
            onChange={(event) => {
              setRequestReason(event.target.value);
              setRequestedEvent(null);
              setErrorMessage('');
            }}
            rows={3}
            className="rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
            placeholder="Explain why this export is needed."
          />
        </label>

        {selectedDefinition ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#020817]/70 p-4">
            <p className="text-sm font-black text-white">
              {selectedDefinition.label}
            </p>

            <p className="mt-2 text-sm leading-7 text-slate-400">
              {selectedDefinition.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-[#07142f]/80 px-2 py-1 text-xs font-bold text-slate-300">
                Format: {selectedDefinition.format}
              </span>

              <span
                className={`rounded-full border px-2 py-1 text-xs font-bold ${
                  selectedDefinition.currentlyAvailable
                    ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
                    : 'border-amber-300/20 bg-amber-400/10 text-amber-100'
                }`}
              >
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
            className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-5 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="rounded-full border border-white/10 bg-[#020817]/70 px-5 py-2 text-sm font-black text-slate-200 transition hover:bg-[#0b1d3f]"
          >
            Clear message
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold leading-7 text-red-100">
            {errorMessage}
          </div>
        ) : null}

        {requestedEvent && selectedDefinition ? (
          <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold leading-7 text-emerald-100">
            Export request recorded for {selectedDefinition.label}. Current
            status: <span className="font-black">{requestedEvent.status}</span>.
            {requestedEvent.status === 'GENERATED'
              ? ' The export is ready to download from your request history below.'
              : null}
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ExportMetricCard
          label="Requested"
          value={countByStatus(requests, 'REQUESTED')}
        />
        <ExportMetricCard
          label="Approved"
          value={countByStatus(requests, 'APPROVED')}
        />
        <ExportMetricCard
          label="Declined"
          value={countByStatus(requests, 'DECLINED')}
        />
        <ExportMetricCard
          label="Generated"
          value={countByStatus(requests, 'GENERATED')}
        />
        <ExportMetricCard
          label="Failed"
          value={countByStatus(requests, 'FAILED')}
        />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <h2 className="text-lg font-black text-white">
          My export request history
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
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
                      Date range
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {formatDate(request.dateFrom)} to{' '}
                      {formatDate(request.dateTo)}
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

                  <div className="rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                    <dt className="text-xs font-bold text-slate-500">
                      Reviewed at
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {formatDateTime(request.reviewedAt)}
                    </dd>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3">
                    <dt className="text-xs font-bold text-slate-500">
                      Generated at
                    </dt>
                    <dd className="mt-1 font-black text-white">
                      {formatDateTime(request.generatedAt)}
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

                {request.reviewReason ? (
                  <p className="mt-4 rounded-2xl border border-white/10 bg-[#07142f]/80 px-4 py-3 leading-7 text-slate-300">
                    <span className="font-black text-white">
                      Review reason:
                    </span>{' '}
                    {request.reviewReason}
                  </p>
                ) : null}

                {isGenerated ? (
                  <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 leading-7 text-emerald-100">
                    <p>
                      This export has been generated and is ready to download.
                    </p>

                    <a
                      href={`/internal/api/researcher/exports/requests/${encodeURIComponent(
                        request.id
                      )}/download`}
                      className="mt-3 inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/15 px-4 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20"
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
          <p className="mt-5 rounded-2xl border border-white/10 bg-[#020817]/70 p-4 text-sm text-slate-500">
            No export requests have been created yet.
          </p>
        ) : null}
      </section>
    </section>
  );
}
