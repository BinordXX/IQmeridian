"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AssessmentTimerPanelProps = {
  expiresAt?: string;
  onExpired?: () => void;
};

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

export const AssessmentTimerPanel = ({
  expiresAt,
  onExpired,
}: AssessmentTimerPanelProps) => {
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const hasNotifiedExpiryRef = useRef(false);

  const remainingSeconds = useMemo(() => {
    return calculateRemainingSeconds(expiresAt, currentTime);
  }, [expiresAt, currentTime]);

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

  const isLowTime =
    typeof remainingSeconds === "number" && remainingSeconds <= 300;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Time remaining
      </p>

      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          isLowTime ? "text-red-700" : "text-slate-950"
        }`}
      >
        {remainingSeconds === null
          ? "Pending"
          : formatRemainingTime(remainingSeconds)}
      </p>
    </section>
  );
};