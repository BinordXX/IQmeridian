'use client';

import { useState } from 'react';

import {
  itemStatusLabels,
  type InternalItem,
  type InternalItemStatus,
  type ItemStatusHistoryEntry,
} from '../_data/internal-tooling-data';

type LocalAuditEntry = ItemStatusHistoryEntry & {
  previousStatus: InternalItemStatus;
};

export function ItemActionPanel({ item }: { item: InternalItem }) {
  const [currentStatus, setCurrentStatus] = useState<InternalItemStatus>(
    item.status
  );
  const [reason, setReason] = useState('');
  const [localAuditEntries, setLocalAuditEntries] = useState<LocalAuditEntry[]>(
    []
  );
  const [error, setError] = useState('');

  const canActivate = currentStatus !== 'ACTIVE' && currentStatus !== 'RETIRED';
  const canRetire = currentStatus !== 'RETIRED';

  function performStatusAction(nextStatus: InternalItemStatus) {
    const trimmedReason = reason.trim();

    if (trimmedReason.length < 8) {
      setError('Add a clear audit reason before changing item status.');
      return;
    }

    const auditEntry: LocalAuditEntry = {
      id: `LOCAL-AUDIT-${Date.now()}`,
      previousStatus: currentStatus,
      status: nextStatus,
      actor: 'Internal user',
      reason: trimmedReason,
      occurredAt: new Date().toLocaleString(),
    };

    setLocalAuditEntries((current) => [auditEntry, ...current]);
    setCurrentStatus(nextStatus);
    setReason('');
    setError('');
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold">Activation and retirement</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          These actions are intentionally explicit because item availability
          affects assessment comparability. In this UI scaffold, actions are
          staged locally; API persistence should later create durable audit-log
          records.
        </p>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">Current displayed status</p>
        <p className="mt-1 text-lg font-semibold">
          {itemStatusLabels[currentStatus]}
        </p>
      </div>

      <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-slate-700">
        Audit reason
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          placeholder="Explain why this item is being activated or retired."
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
        />
      </label>

      {error ? (
        <p className="mt-3 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canActivate}
          onClick={() => performStatusAction('ACTIVE')}
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Activate item
        </button>

        <button
          type="button"
          disabled={!canRetire}
          onClick={() => performStatusAction('RETIRED')}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:cursor-not-allowed disabled:text-slate-400"
        >
          Retire item
        </button>
      </div>

      {currentStatus === 'RETIRED' ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Retired items should not be silently reactivated. A versioned
          successor should normally be created if the item needs to return to
          operational use.
        </p>
      ) : null}

      <div className="mt-6">
        <h3 className="text-sm font-semibold">Local action audit preview</h3>

        {localAuditEntries.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No local activation or retirement action has been staged in this
            session.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {localAuditEntries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm"
              >
                <p className="font-semibold text-slate-950">
                  {itemStatusLabels[entry.previousStatus]} →{' '}
                  {itemStatusLabels[entry.status]}
                </p>
                <p className="mt-1 text-slate-600">{entry.reason}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {entry.actor} · {entry.occurredAt}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
