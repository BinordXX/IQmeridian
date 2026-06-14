'use client';

import { useState } from 'react';

import {
  createDirectAnalyticsExport,
  type AnalyticsExportDataset,
  type AnalyticsExportDefinition,
} from '../_lib/internal-api';

function downloadTextFile({
  fileName,
  contentType,
  content,
}: {
  fileName: string;
  contentType: string;
  content: string;
}) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export function AdminDirectExportClient({
  definitions,
}: {
  definitions: AnalyticsExportDefinition[];
}) {
  const [selectedDataset, setSelectedDataset] =
    useState<AnalyticsExportDataset>(definitions[0]?.dataset ?? 'ITEM_LEVEL');
  const [dateFrom, setDateFrom] = useState('2026-06-01');
  const [dateTo, setDateTo] = useState('2026-06-06');
  const [directReason, setDirectReason] = useState(
    'Platform-admin direct export for internal governance review.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedDefinition = definitions.find(
    (definition) => definition.dataset === selectedDataset
  );

  async function handleDirectExport() {
    if (!selectedDefinition) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const file = await createDirectAnalyticsExport({
        dataset: selectedDefinition.dataset,
        format: selectedDefinition.format,
        dateFrom,
        dateTo,
        directReason,
      });

      downloadTextFile(file);

      setSuccessMessage(
        `Direct export generated and downloaded: ${file.fileName}.`
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Direct analytics export could not be created.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Admin direct export
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Generate export without approval queue
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Platform admins can create a direct export when governance does not
            require a researcher approval workflow. A reason is mandatory and
            the action is recorded as generated and downloaded audit activity.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Export dataset
          <select
            value={selectedDataset}
            onChange={(event) => {
              setSelectedDataset(event.target.value as AnalyticsExportDataset);
              setErrorMessage('');
              setSuccessMessage('');
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
              setErrorMessage('');
              setSuccessMessage('');
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
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-700">
        Direct export reason
        <textarea
          value={directReason}
          onChange={(event) => {
            setDirectReason(event.target.value);
            setErrorMessage('');
            setSuccessMessage('');
          }}
          rows={3}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          placeholder="Required. Explain why this direct export is being generated."
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

      <div className="mt-6">
        <button
          type="button"
          disabled={!selectedDefinition?.currentlyAvailable || isSubmitting}
          onClick={() => void handleDirectExport()}
          className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {isSubmitting ? 'Generating export...' : 'Generate direct export'}
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          {successMessage}
        </div>
      ) : null}
    </section>
  );
}
