'use client';

import { useState } from 'react';

import {
  requestAnalyticsExport,
  type AnalyticsExportDataset,
  type AnalyticsExportDefinition,
  type InternalAuditEvent,
} from '../_lib/internal-api';

export function AnalyticsExportClient({
  definitions,
}: {
  definitions: AnalyticsExportDefinition[];
}) {
  const [selectedDataset, setSelectedDataset] =
    useState<AnalyticsExportDataset>(definitions[0]?.dataset ?? 'ITEM_LEVEL');
  const [dateFrom, setDateFrom] = useState('2026-06-01');
  const [dateTo, setDateTo] = useState('2026-06-06');
  const [requestedEvent, setRequestedEvent] =
    useState<InternalAuditEvent | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDefinition = definitions.find(
    (definition) => definition.dataset === selectedDataset
  );

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
      });

      setRequestedEvent(event);
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
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Request analytics export</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Export definitions come from the internal API. Export requests are now
          recorded as durable audit events; file generation can be added as a
          later job-processing step.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Export dataset
          <select
            value={selectedDataset}
            onChange={(event) => {
              setSelectedDataset(event.target.value as AnalyticsExportDataset);
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
          {isSubmitting ? 'Recording request...' : 'Request export'}
        </button>

        <button
          type="button"
          onClick={() => {
            setRequestedEvent(null);
            setErrorMessage('');
          }}
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
        >
          Clear request
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          {errorMessage}
        </div>
      ) : null}

      {requestedEvent && selectedDefinition ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          Export request recorded for {selectedDefinition.label} from {dateFrom}{' '}
          to {dateTo}. This request is now stored as audit event{' '}
          <span className="font-semibold">{requestedEvent.id}</span>.
        </div>
      ) : null}

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Dataset</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Availability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {definitions.map((definition) => (
              <tr key={definition.dataset}>
                <td className="px-4 py-4 font-semibold">
                  {definition.label}
                </td>
                <td className="px-4 py-4 text-slate-700">
                  {definition.description}
                </td>
                <td className="px-4 py-4">{definition.format}</td>
                <td className="px-4 py-4">
                  {definition.currentlyAvailable
                    ? 'Available'
                    : 'Pending backend wiring'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}