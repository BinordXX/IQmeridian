'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  formatCorrectRate,
  itemDomainLabels,
  itemStatusLabels,
  type InternalItemOutput,
} from '../_lib/internal-api';

type FilterValue = 'ALL' | string;

const performanceFilterOptions = [
  'ALL',
  'VERY_LOW_CORRECT_RATE',
  'VERY_HIGH_CORRECT_RATE',
  'LOW_EXPOSURE',
  'HIGH_OMISSION',
  'HIGH_AVERAGE_TIME',
  'RETIRED_OR_FLAGGED',
] as const;

type PerformanceFilter = (typeof performanceFilterOptions)[number];

const performancePatternLabels: Record<PerformanceFilter, string> = {
  ALL: 'All performance patterns',
  VERY_LOW_CORRECT_RATE: 'Very low correct rate',
  VERY_HIGH_CORRECT_RATE: 'Very high correct rate',
  LOW_EXPOSURE: 'Low exposure',
  HIGH_OMISSION: 'High omission',
  HIGH_AVERAGE_TIME: 'High average time',
  RETIRED_OR_FLAGGED: 'Retired or flagged',
};

function getPerformancePatterns(item: InternalItemOutput): PerformanceFilter[] {
  const patterns: PerformanceFilter[] = [];

  if (
    item.performance.validResponses >= 20 &&
    item.performance.correctResponseRate <= 0.25
  ) {
    patterns.push('VERY_LOW_CORRECT_RATE');
  }

  if (
    item.performance.validResponses >= 20 &&
    item.performance.correctResponseRate >= 0.9
  ) {
    patterns.push('VERY_HIGH_CORRECT_RATE');
  }

  if (item.performance.exposureCount < 20) {
    patterns.push('LOW_EXPOSURE');
  }

  if (item.performance.omissionCount >= 10) {
    patterns.push('HIGH_OMISSION');
  }

  if (
    item.performance.averageResponseTimeSeconds !== null &&
    item.performance.averageResponseTimeSeconds >= 100
  ) {
    patterns.push('HIGH_AVERAGE_TIME');
  }

  if (item.status === 'RETIRED' || item.status === 'UNDER_REVIEW') {
    patterns.push('RETIRED_OR_FLAGGED');
  }

  return patterns;
}

export function ItemBankManagementClient({
  items,
}: {
  items: InternalItemOutput[];
}) {
  const domainOptions = useMemo(
    () => ['ALL', ...Array.from(new Set(items.map((item) => item.domain)))],
    [items]
  );

  const statusOptions = useMemo(
    () => ['ALL', ...Array.from(new Set(items.map((item) => item.status)))],
    [items]
  );

  const [domainFilter, setDomainFilter] = useState<FilterValue>('ALL');
  const [statusFilter, setStatusFilter] = useState<FilterValue>('ALL');
  const [performanceFilter, setPerformanceFilter] =
    useState<PerformanceFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const performancePatterns = getPerformancePatterns(item);

      const matchesDomain =
        domainFilter === 'ALL' || item.domain === domainFilter;
      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;
      const matchesPerformance =
        performanceFilter === 'ALL' ||
        performancePatterns.includes(performanceFilter);
      const matchesSearch =
        normalisedSearch.length === 0 ||
        item.id.toLowerCase().includes(normalisedSearch) ||
        item.label.toLowerCase().includes(normalisedSearch) ||
        item.prompt.toLowerCase().includes(normalisedSearch);

      return (
        matchesDomain && matchesStatus && matchesPerformance && matchesSearch
      );
    });
  }, [domainFilter, items, performanceFilter, searchTerm, statusFilter]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Item-bank management</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            This table supports quick review of item status, domain, exposure,
            response behaviour, and operational readiness. Open an item detail
            page before activating it so the decision is made with context.
          </p>
        </div>

        <Link
          href="/internal/researcher/item-bank/new"
          className="w-fit rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Create new item
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Search item ID, label, or prompt
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Example: abstract or matrix"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Filter by domain
          <select
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {domainOptions.map((domain) => (
              <option key={domain} value={domain}>
                {domain === 'ALL'
                  ? 'All domains'
                  : (itemDomainLabels[domain] ?? domain)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Filter by status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL'
                  ? 'All statuses'
                  : (itemStatusLabels[status] ?? status)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Filter by performance
          <select
            value={performanceFilter}
            onChange={(event) =>
              setPerformanceFilter(event.target.value as PerformanceFilter)
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {performanceFilterOptions.map((pattern) => (
              <option key={pattern} value={pattern}>
                {performancePatternLabels[pattern]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full min-w-[1280px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Operational readiness</th>
              <th className="px-4 py-3">Exposure</th>
              <th className="px-4 py-3">Valid responses</th>
              <th className="px-4 py-3">Correct rate</th>
              <th className="px-4 py-3">Omissions</th>
              <th className="px-4 py-3">Avg time</th>
              <th className="px-4 py-3">Performance flags</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredItems.map((item) => {
              const performancePatterns = getPerformancePatterns(item);
              const detailHref = `/internal/researcher/item-bank/${encodeURIComponent(
                item.id
              )}`;
              const needsAttachment =
                item.status !== 'ACTIVE' &&
                item.status !== 'RETIRED' &&
                item.activeFormAssociationCount === 0;

              return (
                <tr key={item.id} className="align-top hover:bg-slate-50">
                  <td className="px-4 py-4">
                    <Link
                      href={detailHref}
                      className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                    >
                      {item.id}
                    </Link>
                    <Link
                      href={detailHref}
                      className="mt-1 block line-clamp-2 text-slate-600 underline-offset-4 hover:underline"
                    >
                      {item.label}
                    </Link>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                      {item.prompt}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {itemDomainLabels[item.domain] ?? item.domain}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-full border border-slate-300 px-2 py-1 text-xs font-semibold">
                      {itemStatusLabels[item.status] ?? item.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {item.status === 'ACTIVE' ? (
                      <span className="text-xs font-semibold text-slate-700">
                        Operationally active
                      </span>
                    ) : needsAttachment ? (
                      <span className="text-xs font-semibold text-amber-700">
                        Attach before activation
                      </span>
                    ) : item.status === 'RETIRED' ? (
                      <span className="text-xs font-semibold text-slate-500">
                        Retired; new version required
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-700">
                        Open detail to activate
                      </span>
                    )}

                    <p className="mt-1 text-xs text-slate-500">
                      {item.activeFormAssociationCount} active form mapping
                      {item.activeFormAssociationCount === 1 ? '' : 's'}
                    </p>
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {item.performance.exposureCount}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {item.performance.validResponses}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {formatCorrectRate(item.performance.correctResponseRate)}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {item.performance.omissionCount}
                  </td>

                  <td className="px-4 py-4 text-slate-700">
                    {item.performance.averageResponseTimeSeconds === null
                      ? 'No data'
                      : `${item.performance.averageResponseTimeSeconds}s`}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex max-w-[220px] flex-wrap gap-2">
                      {performancePatterns.length > 0 ? (
                        performancePatterns.map((pattern) => (
                          <span
                            key={pattern}
                            className="rounded-full border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700"
                          >
                            {performancePatternLabels[pattern]}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">
                          No current pattern
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <Link
                        href={detailHref}
                        className="w-fit rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                      >
                        Open detail
                      </Link>

                      <Link
                        href={`${detailHref}/performance`}
                        className="w-fit rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                      >
                        Performance
                      </Link>

                      <Link
                        href={`${detailHref}/traceability`}
                        className="w-fit rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                      >
                        Traceability
                      </Link>

                      {needsAttachment ? (
                        <Link
                          href={`${detailHref}/attach-form`}
                          className="w-fit rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                        >
                          Attach to form
                        </Link>
                      ) : null}

                      {item.status === 'DRAFT' ? (
                        <Link
                          href={`/internal/researcher/item-bank/edit?itemId=${encodeURIComponent(
                            item.id
                          )}`}
                          className="w-fit rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                        >
                          Edit draft
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredItems.length === 0 ? (
          <div className="bg-white px-4 py-8 text-center text-sm text-slate-600">
            No items match the current filters.
          </div>
        ) : null}
      </div>
    </section>
  );
}
