"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AssessmentTimerPanelProps = {
  expiresAt?: string;
  onExpired?: () => void;
};

type TimerUrgency = "normal" | "low" | "critical" | "expired" | "unknown";

const formatRemainingTime = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const calculateRemainingSeconds = (
  expiresAt: string | undefined,
  currentTime: number,
): number | null => {
  if (!expiresAt) {
    return null;
  }

  const expiryTime = new Date(expiresAt).getTime();

  if (Number.isNaN(expiryTime)) {
    return null;
  }

  return Math.max(0, Math.ceil((expiryTime - currentTime) / 1000));
};

const getTimerUrgency = (remainingSeconds: number | null): TimerUrgency => {
  if (remainingSeconds === null) {
    return "unknown";
  }

  if (remainingSeconds === 0) {
    return "expired";
  }

  if (remainingSeconds <= 60) {
    return "critical";
  }

  if (remainingSeconds <= 300) {
    return "low";
  }

  return "normal";
};

const getTimerStatusText = (urgency: TimerUrgency): string => {
  switch (urgency) {
    case "expired":
      return "Time has expired.";
    case "critical":
      return "Less than one minute remaining.";
    case "low":
      return "Less than five minutes remaining.";
    case "unknown":
      return "Awaiting confirmed session timing.";
    case "normal":
    default:
      return "Assessment time is active.";
  }
};

const getTimerTextClassName = (urgency: TimerUrgency): string => {
  switch (urgency) {
    case "expired":
    case "critical":
      return "text-red-700";
    case "low":
      return "text-amber-700";
    case "unknown":
      return "text-slate-500";
    case "normal":
    default:
      return "text-slate-950";
  }
};

const getTimerContainerClassName = (urgency: TimerUrgency): string => {
  switch (urgency) {
    case "expired":
    case "critical":
      return "border-red-200 bg-red-50";
    case "low":
      return "border-amber-200 bg-amber-50";
    case "unknown":
      return "border-slate-200 bg-white";
    case "normal":
    default:
      return "border-slate-200 bg-white";
  }
};

export const AssessmentTimerPanel = ({
  expiresAt,
  onExpired,
}: AssessmentTimerPanelProps) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const hasNotifiedExpiryRef = useRef(false);

  const remainingSeconds = useMemo(() => {
    return calculateRemainingSeconds(expiresAt, currentTime);
  }, [expiresAt, currentTime]);

  const urgency = getTimerUrgency(remainingSeconds);
  const statusText = getTimerStatusText(urgency);

  useEffect(() => {
    hasNotifiedExpiryRef.current = false;
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresAt) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [expiresAt]);

  useEffect(() => {
    if (remainingSeconds !== 0 || hasNotifiedExpiryRef.current) {
      return;
    }

    hasNotifiedExpiryRef.current = true;
    onExpired?.();
  }, [remainingSeconds, onExpired]);

  return (
    <section
      className={`rounded-2xl border px-5 py-4 shadow-sm ${getTimerContainerClassName(
        urgency,
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
              urgency,
            )}`}
            aria-live="polite"
          >
            {remainingSeconds === null
              ? "--:--"
              : formatRemainingTime(remainingSeconds)}
          </p>
        </div>

        <span
          className={`mt-1 h-3 w-3 rounded-full ${
            urgency === "expired" || urgency === "critical"
              ? "bg-red-700"
              : urgency === "low"
                ? "bg-amber-600"
                : "bg-slate-400"
          }`}
          aria-hidden="true"
        />
      </div>

      <p className={`mt-2 text-xs font-medium ${getTimerTextClassName(urgency)}`}>
        {statusText}
      </p>
    </section>
  );
};