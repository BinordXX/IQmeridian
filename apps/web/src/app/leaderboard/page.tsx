import { Crown, Home, ShieldCheck, Trophy, UserRound } from 'lucide-react';
import Link from 'next/link';

import { LeaderboardAutoRefreshClient } from './leaderboard-auto-refresh-client';

type PublicLeaderboardEntry = {
  entryId: string;
  rank: number;
  displayName: string;
  profileSlug: string | null;
  avatarUrl: string | null;
  iqScore: number;
  percentile: number | null;
  scoreBand: string;
  generatedAt: string;
};

type PublicLeaderboardResponse = {
  generatedAt: string;
  limit: number;
  count: number;
  totalRanked: number;
  entries: PublicLeaderboardEntry[];
};

const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  'http://localhost:3001';

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(parsed);
};

const formatScoreBand = (value?: string | null) => {
  if (!value) return 'Unavailable';

  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatPercentile = (value?: number | null) => {
  if (typeof value !== 'number') return 'Not available';

  return `${Math.round(value)}th percentile`;
};

const getInitials = (value: string) => {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

const getRankBadgeClassName = (rank: number) => {
  if (rank === 1) {
    return 'border-amber-300/25 bg-amber-400/15 text-amber-100';
  }

  if (rank === 2) {
    return 'border-slate-300/25 bg-slate-300/10 text-slate-100';
  }

  if (rank === 3) {
    return 'border-orange-300/25 bg-orange-400/15 text-orange-100';
  }

  return 'border-cyan-300/15 bg-cyan-400/10 text-cyan-100';
};

const getLeaderboard = async (): Promise<PublicLeaderboardResponse> => {
  const response = await fetch(`${API_BASE_URL}/leaderboard?limit=100`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Unable to load the public leaderboard.');
  }

  return response.json() as Promise<PublicLeaderboardResponse>;
};

export default async function PublicLeaderboardPage() {
  let leaderboard: PublicLeaderboardResponse | null = null;
  let pageError: string | null = null;

  try {
    leaderboard = await getLeaderboard();
  } catch (error) {
    pageError =
      error instanceof Error
        ? error.message
        : 'Unable to load the public leaderboard.';
  }

  const entries = leaderboard?.entries ?? [];
  const topThree = entries.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-8 text-white sm:px-6">
      <LeaderboardAutoRefreshClient />

      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(250,204,21,0.13),transparent_24%)]"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                IQMeridian public leaderboard
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
                Top IQ Score rankings
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                This leaderboard shows public, opt-in IQMeridian rankings only.
                Public profiles are shown only when users choose to publish one.
                Emails, legal names, private session IDs, raw responses, and
                validity internals remain hidden.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
                href="/"
              >
                <Home size={16} strokeWidth={2} />
                Home
              </Link>

              <Link
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/15"
                href="/dashboard"
              >
                <UserRound size={16} strokeWidth={2} />
                My dashboard
              </Link>
            </div>
          </div>
        </section>

        {pageError ? (
          <section className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm font-bold text-amber-100">
            {pageError}
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {topThree.length > 0 ? (
            topThree.map((entry) => (
              <article
                className={`rounded-[2rem] border p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)] ${getRankBadgeClassName(
                  entry.rank
                )}`}
                key={entry.entryId}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-current/20 bg-white/5">
                    {entry.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={entry.avatarUrl}
                      />
                    ) : entry.rank === 1 ? (
                      <Crown size={22} strokeWidth={2} />
                    ) : (
                      <Trophy size={22} strokeWidth={2} />
                    )}
                  </span>

                  <span className="rounded-full border border-current/20 bg-white/5 px-3 py-1 text-xs font-black">
                    #{entry.rank}
                  </span>
                </div>

                <h2 className="mt-5 truncate text-2xl font-black text-white">
                  {entry.displayName}
                </h2>

                <p className="mt-4 text-6xl font-black tracking-tight text-white">
                  {entry.iqScore}
                </p>
                <p className="mt-1 text-sm font-bold text-current">
                  IQMeridian IQ Score
                </p>

                <dl className="mt-5 grid gap-3 text-sm">
                  <div>
                    <dt className="font-bold opacity-70">Percentile</dt>
                    <dd className="mt-1 font-black text-white">
                      {formatPercentile(entry.percentile)}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold opacity-70">Band</dt>
                    <dd className="mt-1 font-black text-white">
                      {formatScoreBand(entry.scoreBand)}
                    </dd>
                  </div>

                  <div>
                    <dt className="font-bold opacity-70">Generated</dt>
                    <dd className="mt-1 font-black text-white">
                      {formatDate(entry.generatedAt)}
                    </dd>
                  </div>
                </dl>

                {entry.profileSlug ? (
                  <Link
                    className="mt-5 inline-flex rounded-2xl border border-current/20 bg-white/5 px-4 py-2 text-xs font-black text-white transition hover:bg-white/10"
                    href={`/leaderboard/profile/${entry.profileSlug}`}
                  >
                    View profile
                  </Link>
                ) : null}
              </article>
            ))
          ) : (
            <article className="rounded-[2rem] border border-dashed border-white/10 bg-[#07142f]/82 p-6 md:col-span-3">
              <h2 className="text-2xl font-black text-white">
                No public rankings yet
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Public leaderboard entries will appear after eligible consumers
                opt in.
              </p>
            </article>
          )}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Ranking table
              </p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Public top list
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Showing {entries.length} of{' '}
                {leaderboard?.totalRanked ?? entries.length} ranked public
                profile{entries.length === 1 ? '' : 's'}.
              </p>
            </div>

            <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-slate-300">
              Updated {formatDate(leaderboard?.generatedAt)}
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <div className="hidden grid-cols-[0.4fr_1.4fr_0.7fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-4 border-b border-white/10 bg-white/[0.035] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:grid">
              <span>Rank</span>
              <span>Profile</span>
              <span>IQ Score</span>
              <span>Percentile</span>
              <span>Band</span>
              <span>Date</span>
              <span className="text-right">Action</span>
            </div>

            <div className="divide-y divide-white/10">
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <div
                    className="grid gap-4 px-4 py-4 lg:grid-cols-[0.4fr_1.4fr_0.7fr_0.8fr_0.8fr_0.8fr_0.8fr] lg:items-center"
                    key={entry.entryId}
                  >
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                        Rank
                      </p>
                      <p className="font-black text-cyan-100">#{entry.rank}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-xs font-black text-cyan-100">
                        {entry.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt=""
                            className="h-full w-full object-cover"
                            src={entry.avatarUrl}
                          />
                        ) : (
                          getInitials(entry.displayName) || 'IQ'
                        )}
                      </span>

                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                          Profile
                        </p>
                        <p className="font-black text-white">
                          {entry.displayName}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                        IQ Score
                      </p>
                      <p className="text-2xl font-black text-white lg:text-lg">
                        {entry.iqScore}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                        Percentile
                      </p>
                      <p className="font-black text-white">
                        {formatPercentile(entry.percentile)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                        Band
                      </p>
                      <p className="font-black text-white">
                        {formatScoreBand(entry.scoreBand)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 lg:hidden">
                        Date
                      </p>
                      <p className="font-black text-white">
                        {formatDate(entry.generatedAt)}
                      </p>
                    </div>

                    <div className="lg:text-right">
                      {entry.profileSlug ? (
                        <Link
                          className="inline-flex rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-100 transition hover:bg-cyan-400/15"
                          href={`/leaderboard/profile/${entry.profileSlug}`}
                        >
                          View profile
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          No profile
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-5 text-sm text-slate-500">
                  No leaderboard entries available.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-300/10 bg-[#07142f]/80 p-4 text-xs leading-6 text-slate-500">
          <div className="flex gap-2">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-cyan-300"
              size={16}
              strokeWidth={2}
            />
            <p>
              Public leaderboard ranking is opt-in and uses only eligible
              consumer-owned IQ Score results. Public profiles show user-chosen
              profile data only. Private assessment details remain hidden.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
