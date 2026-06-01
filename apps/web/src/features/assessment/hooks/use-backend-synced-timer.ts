"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { syncAssessmentSessionState } from "../api/assessment-api";
import type {
  AssessmentSessionPayload,
  AssessmentSessionStatus,
} from "../contracts/assessment-contracts";

export type BackendTimerSyncStatus =
  | "idle"
  | "syncing"
  | "synced"
  | "failed";

export type BackendTimerSource =
  | "backend_remaining_seconds"
  | "backend_server_time"
  | "client_fallback";

type TimerSnapshot = {
  remainingSecondsAtSync: number | null;
  syncedClientTimeMs: number;
  expiresAt?: string;
  serverNow?: string;
  source: BackendTimerSource;
};

type TimerState = TimerSnapshot & {
  syncStatus: BackendTimerSyncStatus;
  lastSyncedAt?: string;
  sessionStatus?: AssessmentSessionStatus;
};

type UseBackendSyncedTimerInput = {
  sessionId: string;
  initialExpiresAt?: string;
  initialServerNow?: string;
  initialRemainingSeconds?: number;
  syncIntervalMs?: number;
  onExpired?: () => void;
};

const getMonotonicTime = (): number => {
  if (typeof performance !== "undefined") {
    return performance.now();
  }

  return Date.now();
};

const normaliseRemainingSeconds = (value: number): number => {
  return Math.max(0, Math.floor(value));
};

const calculateRemainingFromDates = (
  expiresAt: string | undefined,
  now: string | undefined,
): number | null => {
  if (!expiresAt || !now) {
    return null;
  }

  const expiresAtMs = new Date(expiresAt).getTime();
  const nowMs = new Date(now).getTime();

  if (Number.isNaN(expiresAtMs) || Number.isNaN(nowMs)) {
    return null;
  }

  return normaliseRemainingSeconds((expiresAtMs - nowMs) / 1000);
};

const calculateRemainingFromClientClock = (
  expiresAt: string | undefined,
): number | null => {
  if (!expiresAt) {
    return null;
  }

  const expiresAtMs = new Date(expiresAt).getTime();

  if (Number.isNaN(expiresAtMs)) {
    return null;
  }

  return normaliseRemainingSeconds((expiresAtMs - Date.now()) / 1000);
};

const buildSnapshotFromSession = (
  session: AssessmentSessionPayload,
): TimerSnapshot => {
  const expiresAt =
    session.timing?.sectionExpiresAt ??
    session.timing?.expiresAt ??
    session.expiresAt;

  const serverNow = session.timing?.serverNow ?? session.serverNow;

  const backendRemainingSeconds =
    session.timing?.sectionRemainingSeconds ?? session.timing?.remainingSeconds;

  if (typeof backendRemainingSeconds === "number") {
    return {
      remainingSecondsAtSync: normaliseRemainingSeconds(
        backendRemainingSeconds,
      ),
      syncedClientTimeMs: getMonotonicTime(),
      expiresAt,
      serverNow,
      source: "backend_remaining_seconds",
    };
  }

  const serverBasedRemainingSeconds = calculateRemainingFromDates(
    expiresAt,
    serverNow,
  );

  if (serverBasedRemainingSeconds !== null) {
    return {
      remainingSecondsAtSync: serverBasedRemainingSeconds,
      syncedClientTimeMs: getMonotonicTime(),
      expiresAt,
      serverNow,
      source: "backend_server_time",
    };
  }

  return {
    remainingSecondsAtSync: calculateRemainingFromClientClock(expiresAt),
    syncedClientTimeMs: getMonotonicTime(),
    expiresAt,
    serverNow,
    source: "client_fallback",
  };
};

const buildInitialSnapshot = ({
  initialExpiresAt,
  initialServerNow,
  initialRemainingSeconds,
}: {
  initialExpiresAt?: string;
  initialServerNow?: string;
  initialRemainingSeconds?: number;
}): TimerSnapshot => {
  if (typeof initialRemainingSeconds === "number") {
    return {
      remainingSecondsAtSync: normaliseRemainingSeconds(
        initialRemainingSeconds,
      ),
      syncedClientTimeMs: getMonotonicTime(),
      expiresAt: initialExpiresAt,
      serverNow: initialServerNow,
      source: "backend_remaining_seconds",
    };
  }

  const serverBasedRemainingSeconds = calculateRemainingFromDates(
    initialExpiresAt,
    initialServerNow,
  );

  if (serverBasedRemainingSeconds !== null) {
    return {
      remainingSecondsAtSync: serverBasedRemainingSeconds,
      syncedClientTimeMs: getMonotonicTime(),
      expiresAt: initialExpiresAt,
      serverNow: initialServerNow,
      source: "backend_server_time",
    };
  }

  return {
    remainingSecondsAtSync: calculateRemainingFromClientClock(initialExpiresAt),
    syncedClientTimeMs: getMonotonicTime(),
    expiresAt: initialExpiresAt,
    serverNow: initialServerNow,
    source: "client_fallback",
  };
};

export const useBackendSyncedTimer = ({
  sessionId,
  initialExpiresAt,
  initialServerNow,
  initialRemainingSeconds,
  syncIntervalMs = 15_000,
  onExpired,
}: UseBackendSyncedTimerInput) => {
  const hasNotifiedExpiryRef = useRef(false);

  const [tickTimeMs, setTickTimeMs] = useState(() => getMonotonicTime());

  const [timerState, setTimerState] = useState<TimerState>(() => ({
    ...buildInitialSnapshot({
      initialExpiresAt,
      initialServerNow,
      initialRemainingSeconds,
    }),
    syncStatus: "idle",
  }));

  const remainingSeconds = useMemo(() => {
    if (timerState.remainingSecondsAtSync === null) {
      return null;
    }

    const elapsedSeconds = Math.floor(
      (tickTimeMs - timerState.syncedClientTimeMs) / 1000,
    );

    return Math.max(0, timerState.remainingSecondsAtSync - elapsedSeconds);
  }, [
    tickTimeMs,
    timerState.remainingSecondsAtSync,
    timerState.syncedClientTimeMs,
  ]);

  const syncNow = useCallback(async (): Promise<void> => {
    setTimerState((previous) => ({
      ...previous,
      syncStatus: "syncing",
    }));

    try {
      const session = await syncAssessmentSessionState(sessionId);
      const snapshot = buildSnapshotFromSession(session);

      setTimerState({
        ...snapshot,
        syncStatus: "synced",
        lastSyncedAt: new Date().toISOString(),
        sessionStatus: session.status,
      });

      if (
        session.status === "expired" ||
        snapshot.remainingSecondsAtSync === 0
      ) {
        hasNotifiedExpiryRef.current = true;
        onExpired?.();
      }
    } catch {
      setTimerState((previous) => ({
        ...previous,
        syncStatus: "failed",
      }));
    }
  }, [onExpired, sessionId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTickTimeMs(getMonotonicTime());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

useEffect(() => {
  const initialSyncId = window.setTimeout(() => {
    void syncNow();
  }, 0);

  const intervalId = window.setInterval(() => {
    void syncNow();
  }, syncIntervalMs);

  return () => {
    window.clearTimeout(initialSyncId);
    window.clearInterval(intervalId);
  };
}, [syncIntervalMs, syncNow]);

  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        void syncNow();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [syncNow]);

  useEffect(() => {
    if (remainingSeconds !== 0 || hasNotifiedExpiryRef.current) {
      return;
    }

    hasNotifiedExpiryRef.current = true;
    onExpired?.();
  }, [onExpired, remainingSeconds]);

  return {
    remainingSeconds,
    syncStatus: timerState.syncStatus,
    lastSyncedAt: timerState.lastSyncedAt,
    timingSource: timerState.source,
    sessionStatus: timerState.sessionStatus,
    expiresAt: timerState.expiresAt,
    syncNow,
  };
};