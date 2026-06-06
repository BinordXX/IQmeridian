'use client';

import { useState } from 'react';

import {
  analyticsExportDefinitions,
  type AnalyticsExportDataset,
} from '../_data/internal-tooling-data';

export function AnalyticsExportClient() {
  const [selectedDataset, setSelectedDataset] =
    useState<AnalyticsExportDataset>('ITEM_LEVEL');
  const [requested, setRequested] = useState(false);

  const selectedDefinition = analyticsExportDefinitions.find(
    (definition) => definition.dataset === selectedDataset
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Request analytics export</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          This screen defines structured internal exports for research,
          operational review, and quality control. The current UI stages export
          requests; later implementation should attach authorisation, file
          generation, audit logging, and download expiry.
        </p>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Export dataset
          <select
            value={selectedDataset}
            onChange={(event) => {
              setSelectedDataset(event.target.value as AnalyticsExportDataset);
              setRequested(false);
            }}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {analyticsExportDefinitions.map((definition) => (
              <option key={definition.dataset} value={definition.dataset}>
                {definition.label}
              </option>
            ))}
          </select>
        </label>

        {selectedDefinition ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">
              {selectedDefinition.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {selectedDefinition.description}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold">
                {selectedDefinition.format}
              </span>
              <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold">
                {selectedDefinition.currentlyAvailable
                  ? 'Available'
                  : 'Pending backend wiring'}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!selectedDefinition?.currentlyAvailable}
          onClick={() => setRequested(true)}
          className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Request export
        </button>

        <button
          type="button"
          onClick={() => setRequested(false)}
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
        >
          Clear request
        </button>
      </div>

      {requested && selectedDefinition ? (
        <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Export request staged for {selectedDefinition.label}. In the next
          backend iteration, this should create a durable export job and return
          a secure download link.
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
            {analyticsExportDefinitions.map((definition) => (
              <tr key={definition.dataset}>
                <td className="px-4 py-4 font-semibold">{definition.label}</td>
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
