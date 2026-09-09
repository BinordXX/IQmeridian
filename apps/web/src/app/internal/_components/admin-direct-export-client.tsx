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
    <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Admin direct export
          </p>

          <h2 className="mt-3 text-xl font-black text-white">
            Generate export without approval queue
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
            Platform admins can create a direct export when governance does not
            require a researcher approval workflow. A reason is mandatory and
            the action is recorded as generated and downloaded audit activity.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-bold text-slate-300">
          Export dataset
          <select
            value={selectedDataset}
            onChange={(event) => {
              setSelectedDataset(event.target.value as AnalyticsExportDataset);
              setErrorMessage('');
              setSuccessMessage('');
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
              setErrorMessage('');
              setSuccessMessage('');
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
              setErrorMessage('');
              setSuccessMessage('');
            }}
            className="min-h-12 rounded-2xl border border-white/10 bg-[#020817] px-4 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
          />
        </label>
      </div>

      <label className="mt-4 flex flex-col gap-2 text-sm font-bold text-slate-300">
        Direct export reason
        <textarea
          value={directReason}
          onChange={(event) => {
            setDirectReason(event.target.value);
            setErrorMessage('');
            setSuccessMessage('');
          }}
          rows={3}
          className="rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50"
          placeholder="Required. Explain why this direct export is being generated."
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

      <div className="mt-6">
        <button
          type="button"
          disabled={!selectedDefinition?.currentlyAvailable || isSubmitting}
          onClick={() => void handleDirectExport()}
          className="rounded-full border border-cyan-300/25 bg-cyan-400/15 px-5 py-2 text-sm font-black text-cyan-50 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Generating export...' : 'Generate direct export'}
        </button>
      </div>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold leading-7 text-red-100">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold leading-7 text-emerald-100">
          {successMessage}
        </div>
      ) : null}
    </section>
  );
}
