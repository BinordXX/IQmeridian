'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  evaluateItemPerformancePatterns,
  formatCorrectRate,
  internalItems,
  itemDomainLabels,
  itemStatusLabels,
  performancePatternLabels,
  type InternalItemDomain,
  type InternalItemStatus,
  type InternalPerformancePattern,
} from '../_data/internal-tooling-data';

type DomainFilter = 'ALL' | InternalItemDomain;
type StatusFilter = 'ALL' | InternalItemStatus;
type PerformanceFilter = 'ALL' | InternalPerformancePattern;

const domainOptions: DomainFilter[] = [
  'ALL',
  'ABSTRACT',
  'NUMERICAL',
  'VERBAL',
  'SPATIAL',
  'WORKING_MEMORY',
];

const statusOptions: StatusFilter[] = [
  'ALL',
  'DRAFT',
  'ACTIVE',
  'UNDER_REVIEW',
  'RETIRED',
];

const performanceFilterOptions: PerformanceFilter[] = [
  'ALL',
  'VERY_LOW_CORRECT_RATE',
  'VERY_HIGH_CORRECT_RATE',
  'LOW_EXPOSURE',
  'HIGH_OMISSION',
  'HIGH_AVERAGE_TIME',
  'RETIRED_OR_FLAGGED',
];

export function ItemBankManagementClient() {
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [performanceFilter, setPerformanceFilter] =
    useState<PerformanceFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    const normalisedSearch = searchTerm.trim().toLowerCase();

    return internalItems.filter((item) => {
      const performancePatterns = evaluateItemPerformancePatterns(item);

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
        item.label.toLowerCase().includes(normalisedSearch);

      return (
        matchesDomain && matchesStatus && matchesPerformance && matchesSearch
      );
    });
  }, [domainFilter, performanceFilter, searchTerm, statusFilter]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Item-bank management</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Use this screen to inspect item status, domain coverage, activation
            state, review signals, and early performance patterns. Historically
            active items are protected from silent in-place mutation.
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
          Search item ID or label
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Example: IQM-VER or matrix"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Filter by domain
          <select
            value={domainFilter}
            onChange={(event) =>
              setDomainFilter(event.target.value as DomainFilter)
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {domainOptions.map((domain) => (
              <option key={domain} value={domain}>
                {domain === 'ALL' ? 'All domains' : itemDomainLabels[domain]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Filter by status
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as StatusFilter)
            }
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'All statuses' : itemStatusLabels[status]}
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
                {pattern === 'ALL'
                  ? 'All performance patterns'
                  : performancePatternLabels[pattern]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Domain</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Activation</th>
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
              const performancePatterns = evaluateItemPerformancePatterns(item);

              return (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-950">{item.id}</p>
                    <p className="mt-1 text-slate-600">{item.label}</p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {itemDomainLabels[item.domain]}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-slate-300 px-2 py-1 text-xs font-semibold">
                      {itemStatusLabels[item.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {item.active ? 'Currently active' : 'Inactive'}
                    {item.historicallyActive ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Historically active
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">
                        Never activated
                      </p>
                    )}
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
                        href={`/internal/researcher/item-bank/${encodeURIComponent(
                          item.id
                        )}`}
                        className="w-fit rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                      >
                        Detail
                      </Link>

                      <Link
                        href={`/internal/researcher/item-bank/${encodeURIComponent(
                          item.id
                        )}/performance`}
                        className="w-fit rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800"
                      >
                        Performance
                      </Link>

                      {item.status === 'DRAFT' ? (
                        <Link
                          href={`/internal/researcher/item-bank/edit?itemId=${encodeURIComponent(
                            item.id
                          )}`}
                          className="w-fit rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Edit draft
                        </Link>
                      ) : (
                        <span className="text-xs font-medium text-slate-500">
                          Versioning required
                        </span>
                      )}
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
