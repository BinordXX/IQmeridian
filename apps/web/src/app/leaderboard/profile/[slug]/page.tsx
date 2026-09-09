import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Quote,
  ShieldCheck,
  Trophy,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

type PublicProfileResponse = {
  profile: {
    slug: string;
    displayName: string;
    headline: string | null;
    bio: string | null;
    quote: string | null;
    location: string | null;
    avatarUrl: string | null;
    websiteUrl: string | null;
  };
  leaderboard: {
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
};

type PublicProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
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

const getPublicProfile = async (slug: string) => {
  const response = await fetch(`${API_BASE_URL}/leaderboard/profiles/${slug}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    notFound();
  }

  if (!response.ok) {
    throw new Error('Unable to load public profile.');
  }

  return response.json() as Promise<PublicProfileResponse>;
};

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-8 text-white sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_90%_20%,rgba(250,204,21,0.13),transparent_24%)]"
          />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-cyan-400/10 text-3xl font-black text-cyan-100">
                {profile.profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={profile.profile.avatarUrl}
                  />
                ) : (
                  getInitials(profile.profile.displayName) || (
                    <UserRound size={42} strokeWidth={2} />
                  )
                )}
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
                  Public leaderboard profile
                </p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">
                  {profile.profile.displayName}
                </h1>

                {profile.profile.headline ? (
                  <p className="mt-3 max-w-3xl text-base font-bold leading-7 text-slate-300">
                    {profile.profile.headline}
                  </p>
                ) : null}

                {profile.profile.location ? (
                  <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-slate-400">
                    <MapPin size={16} strokeWidth={2} />
                    {profile.profile.location}
                  </p>
                ) : null}
              </div>
            </div>

            <Link
              className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
              href="/leaderboard"
            >
              <ArrowLeft size={16} strokeWidth={2} />
              Back to leaderboard
            </Link>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <h2 className="text-2xl font-black text-white">About</h2>

              {profile.profile.bio ? (
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300">
                  {profile.profile.bio}
                </p>
              ) : (
                <p className="mt-4 text-sm leading-7 text-slate-500">
                  This user has not added a public bio yet.
                </p>
              )}
            </section>

            {profile.profile.quote ? (
              <section className="rounded-[2rem] border border-cyan-300/15 bg-cyan-400/10 p-6">
                <div className="flex gap-3">
                  <Quote
                    className="mt-1 shrink-0 text-cyan-200"
                    size={22}
                    strokeWidth={2}
                  />
                  <p className="text-lg font-black leading-8 text-white">
                    {profile.profile.quote}
                  </p>
                </div>
              </section>
            ) : null}

            {profile.profile.websiteUrl ? (
              <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6">
                <h2 className="text-xl font-black text-white">Links</h2>
                <a
                  className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
                  href={profile.profile.websiteUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Visit website
                  <ExternalLink size={15} strokeWidth={2} />
                </a>
              </section>
            ) : null}
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-amber-300/20 bg-[#07142f]/82 p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-100">
                <Trophy size={26} strokeWidth={2} />
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.3em] text-amber-200">
                Public rank #{profile.leaderboard.rank}
              </p>

              <p className="mt-4 text-7xl font-black tracking-tight text-white">
                {profile.leaderboard.iqScore}
              </p>

              <p className="mt-2 text-sm font-bold text-slate-300">
                IQMeridian IQ Score
              </p>

              <dl className="mt-6 grid gap-3 text-left">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Percentile
                  </dt>
                  <dd className="mt-2 font-black text-white">
                    {formatPercentile(profile.leaderboard.percentile)}
                  </dd>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Band
                  </dt>
                  <dd className="mt-2 font-black text-white">
                    {formatScoreBand(profile.leaderboard.scoreBand)}
                  </dd>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <dt className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Achieved
                  </dt>
                  <dd className="mt-2 font-black text-white">
                    {formatDate(profile.leaderboard.generatedAt)}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-cyan-300/10 bg-[#07142f]/80 p-4 text-xs leading-6 text-slate-500">
              <div className="flex gap-2">
                <ShieldCheck
                  className="mt-0.5 shrink-0 text-cyan-300"
                  size={16}
                  strokeWidth={2}
                />
                <p>
                  This profile contains public information chosen by the user.
                  It does not show email, legal identity, exact address, private
                  session identifiers, item responses, raw answers, or validity
                  internals.
                </p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
