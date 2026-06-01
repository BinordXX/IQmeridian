'use client';

import type {
  BackendTimerSource,
  BackendTimerSyncStatus,
} from '../hooks/use-backend-synced-timer';

type AssessmentTimerPanelProps = {
  remainingSeconds: number | null;
  syncStatus: BackendTimerSyncStatus;
  timingSource: BackendTimerSource;
  lastSyncedAt?: string;
};

type TimerUrgency = 'normal' | 'low' | 'critical' | 'expired' | 'unknown';

const formatRemainingTime = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const getTimerUrgency = (remainingSeconds: number | null): TimerUrgency => {
  if (remainingSeconds === null) {
    return 'unknown';
  }

  if (remainingSeconds === 0) {
    return 'expired';
  }

  if (remainingSeconds <= 60) {
    return 'critical';
  }

  if (remainingSeconds <= 300) {
    return 'low';
  }

  return 'normal';
};

const getTimerStatusText = ({
  urgency,
  syncStatus,
  timingSource,
}: {
  urgency: TimerUrgency;
  syncStatus: BackendTimerSyncStatus;
  timingSource: BackendTimerSource;
}): string => {
  if (urgency === 'expired') {
    return 'Time has expired.';
  }

  if (syncStatus === 'syncing') {
    return 'Checking session time...';
  }

  if (syncStatus === 'failed') {
    return 'Using last known session time.';
  }

  if (timingSource === 'client_fallback') {
    return 'Awaiting confirmed session timing.';
  }

  if (urgency === 'critical') {
    return 'Less than one minute remaining.';
  }

  if (urgency === 'low') {
    return 'Less than five minutes remaining.';
  }

  return 'Synced with session timing.';
};

const getTimerTextClassName = (urgency: TimerUrgency): string => {
  switch (urgency) {
    case 'expired':
    case 'critical':
      return 'text-red-700';
    case 'low':
      return 'text-amber-700';
    case 'unknown':
      return 'text-slate-500';
    case 'normal':
    default:
      return 'text-slate-950';
  }
};

const getTimerContainerClassName = (
  urgency: TimerUrgency,
  syncStatus: BackendTimerSyncStatus
): string => {
  if (syncStatus === 'failed' && urgency !== 'expired') {
    return 'border-amber-200 bg-amber-50';
  }

  switch (urgency) {
    case 'expired':
    case 'critical':
      return 'border-red-200 bg-red-50';
    case 'low':
      return 'border-amber-200 bg-amber-50';
    case 'unknown':
    case 'normal':
    default:
      return 'border-slate-200 bg-white';
  }
};

const formatLastSyncedAt = (lastSyncedAt?: string): string | null => {
  if (!lastSyncedAt) {
    return null;
  }

  const parsed = new Date(lastSyncedAt);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleTimeString();
};

export const AssessmentTimerPanel = ({
  remainingSeconds,
  syncStatus,
  timingSource,
  lastSyncedAt,
}: AssessmentTimerPanelProps) => {
  const urgency = getTimerUrgency(remainingSeconds);
  const statusText = getTimerStatusText({
    urgency,
    syncStatus,
    timingSource,
  });

  const syncedAtText = formatLastSyncedAt(lastSyncedAt);

  return (
    <section
      className={`rounded-2xl border px-5 py-4 shadow-sm ${getTimerContainerClassName(
        urgency,
        syncStatus
      )}`}
      aria-label="Assessment timer"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Time remaining
          </p>

          <p
            className={`mt-1 text-3xl font-bold tabular-nums ${getTimerTextClassName(
              urgency
            )}`}
            aria-live="polite"
          >
            {remainingSeconds === null
              ? '--:--'
              : formatRemainingTime(remainingSeconds)}
          </p>
        </div>

        <span
          className={`mt-1 h-3 w-3 rounded-full ${
            urgency === 'expired' || urgency === 'critical'
              ? 'bg-red-700'
              : urgency === 'low' || syncStatus === 'failed'
                ? 'bg-amber-600'
                : 'bg-slate-400'
          }`}
          aria-hidden="true"
        />
      </div>

      <p
        className={`mt-2 text-xs font-medium ${getTimerTextClassName(urgency)}`}
      >
        {statusText}
      </p>

      {syncedAtText ? (
        <p className="mt-1 text-[11px] font-medium text-slate-500">
          Last checked {syncedAtText}
        </p>
      ) : null}
    </section>
  );
};
