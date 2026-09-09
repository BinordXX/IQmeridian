'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

type LeaderboardAutoRefreshClientProps = {
  intervalMs?: number;
};

export function LeaderboardAutoRefreshClient({
  intervalMs = 5000,
}: LeaderboardAutoRefreshClientProps) {
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [intervalMs, router]);

  return null;
}
