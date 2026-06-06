'use client';

import { useMemo, useState } from 'react';

import {
  analyticsExportDefinitions,
  analyticsExportScopeOptions,
  itemDomainLabels,
  sessionStatusLabels,
  suspiciousFlagStatusLabels,
  type AnalyticsExportDataset,
  type AnalyticsExportFormat,
  type InternalItemDomain,
  type InternalSessionStatus,
  type SuspiciousFlagStatus,
} from '../_data/internal-tooling-data';
import {
  getCurrentInternalRole,
  internalRoleLabels,
} from '../_lib/internal-access-control';

export function AnalyticsExportClient() {
  const currentRole = getCurrentInternalRole();

  const [selectedDataset, setSelectedDataset] =
    useState<AnalyticsExportDataset>('ITEM_LEVEL');
  const [selectedFormat, setSelectedFormat] =
    useState<AnalyticsExportFormat>('CSV');
  const [dateFrom, setDateFrom] = useState('2026-06-01');
  const [dateTo, setDateTo] = useState('2026-06-06');
  const [campaign, setCampaign] = useState('All campaigns');
  const [form, setForm] = useState('All forms');
  const [domain, setDomain] = useState<'ALL' | InternalItemDomain>('ALL');
  const [item, setItem] = useState('All items');
  const [sessionStatus, setSessionStatus] = useState<
    'ALL' | InternalSessionStatus
  >('ALL');
  const [suspiciousFlagStatus, setSuspiciousFlagStatus] = useState<
    'ALL' | SuspiciousFlagStatus
  >('ALL');
  const [requested, setRequested] = useState(false);

  const selectedDefinition = useMemo(
    () =>
      analyticsExportDefinitions.find(
        (definition) => definition.dataset === selectedDataset
      ),
    [selectedDataset]
  );

  const isRoleAllowed =
    selectedDefinition?.requiredRole === currentRole ||
    currentRole === 'PLATFORM_ADMIN';

  const canRequestExport =
    Boolean(selectedDefinition?.currentlyAvailable) && isRoleAllowed;

  function handleDatasetChange(dataset: AnalyticsExportDataset) {
    const definition = analyticsExportDefinitions.find(
      (currentDefinition) => currentDefinition.dataset === dataset
    );

    setSelectedDataset(dataset);
    setSelectedFormat(definition?.defaultFormat ?? 'CSV');
    setRequested(false);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold">Request analytics export</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Exports are CSV-first because CSV is practical for spreadsheet review,
          statistical software, and lightweight research workflows. JSON remains
          available where structured nested records are useful.
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        Current internal role:{' '}
        <span className="font-semibold">{internalRoleLabels[currentRole]}</span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Export dataset
          <select
            value={selectedDataset}
            onChange={(event) =>
              handleDatasetChange(event.target.value as AnalyticsExportDataset)
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {analyticsExportDefinitions.map((definition) => (
              <option key={definition.dataset} value={definition.dataset}>
                {definition.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Export format
          <select
            value={selectedFormat}
            onChange={(event) =>
              setSelectedFormat(event.target.value as AnalyticsExportFormat)
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {selectedDefinition?.supportedFormats.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Date from
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Date to
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Campaign
          <select
            value={campaign}
            onChange={(event) => setCampaign(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {analyticsExportScopeOptions.campaigns.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Form
          <select
            value={form}
            onChange={(event) => setForm(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {analyticsExportScopeOptions.forms.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Domain
          <select
            value={domain}
            onChange={(event) =>
              setDomain(event.target.value as 'ALL' | InternalItemDomain)
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            <option value="ALL">All domains</option>
            {analyticsExportScopeOptions.domains.map((option) => (
              <option key={option} value={option}>
                {itemDomainLabels[option]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Item
          <select
            value={item}
            onChange={(event) => setItem(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {analyticsExportScopeOptions.items.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Session status
          <select
            value={sessionStatus}
            onChange={(event) =>
              setSessionStatus(
                event.target.value as 'ALL' | InternalSessionStatus
              )
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            <option value="ALL">All session statuses</option>
            {analyticsExportScopeOptions.sessionStatuses.map((option) => (
              <option key={option} value={option}>
                {sessionStatusLabels[option]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Suspicious flag status
          <select
            value={suspiciousFlagStatus}
            onChange={(event) =>
              setSuspiciousFlagStatus(
                event.target.value as 'ALL' | SuspiciousFlagStatus
              )
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            <option value="ALL">All suspicious flag statuses</option>
            {analyticsExportScopeOptions.suspiciousFlagStatuses.map(
              (option) => (
                <option key={option} value={option}>
                  {suspiciousFlagStatusLabels[option]}
                </option>
              )
            )}
          </select>
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
              Selected format: {selectedFormat}
            </span>
            <span className="rounded-full border border-slate-300 bg-white px-2 py-1 text-xs font-semibold">
              Required role:{' '}
              {internalRoleLabels[selectedDefinition.requiredRole]}
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
          disabled={!canRequestExport}
          onClick={() => setRequested(true)}
          className="rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Request scoped export
        </button>

        <button
          type="button"
          onClick={() => setRequested(false)}
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-800"
        >
          Clear request
        </button>
      </div>

      {!isRoleAllowed ? (
        <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Your current role cannot request this export. This prevents sensitive
          internal datasets from becoming unrestricted all-or-nothing dumps.
        </div>
      ) : null}

      {requested && selectedDefinition ? (
        <div className="mt-5 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
          Scoped {selectedFormat} export staged for {selectedDefinition.label}.
          Scope: {dateFrom} to {dateTo}, {campaign}, {form}, domain {domain},
          item {item}, session status {sessionStatus}, suspicious flag{' '}
          {suspiciousFlagStatus}.
        </div>
      ) : null}
    </section>
  );
}
