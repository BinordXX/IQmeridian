import {
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  ShieldCheck,
  Trophy,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';

import { updatePublicProfileAction } from '../../actions';
import { getMyPublicProfile } from '../../consumer-dashboard-api';

const formatRank = (rank?: number | null) => {
  if (typeof rank !== 'number') return 'Not ranked';

  return `#${rank}`;
};

const formatScoreBand = (value?: string | null) => {
  if (!value) return 'Unavailable';

  return value
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

type PublicProfileSettingsPageProps = {
  searchParams?: Promise<{
    saved?: string;
    error?: string;
  }>;
};

export default async function PublicProfileSettingsPage({
  searchParams,
}: PublicProfileSettingsPageProps) {
  const query = await searchParams;
  const profile = await getMyPublicProfile();
  const saved = query?.saved === '1';
  const error = query?.error;

  const publicUrl = profile.profile.publicProfileUrl;

  return (
    <main className="space-y-6">
      <section className="rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Public profile
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
              Leaderboard profile settings
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
              Control the person-facing profile shown from the public
              leaderboard. This does not expose your email, legal identity,
              exact address, private session IDs, raw answers, or score-detail
              internals.
            </p>
          </div>

          {publicUrl ? (
            <Link
              className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
              href={publicUrl}
              target="_blank"
            >
              View public profile
              <ExternalLink size={15} strokeWidth={2} />
            </Link>
          ) : null}
        </div>
      </section>

      {saved ? (
        <section className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-black text-emerald-100">
          Public profile saved. It will appear on the leaderboard when profile
          visibility, leaderboard opt-in, and score eligibility are all active.
        </section>
      ) : null}

      {error ? (
        <section className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm font-black text-amber-100">
          {error}
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
        <aside className="space-y-4">
          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                {profile.profile.publicProfileEnabled ? (
                  <Eye size={22} strokeWidth={2} />
                ) : (
                  <EyeOff size={22} strokeWidth={2} />
                )}
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Visibility
                </p>
                <p className="text-lg font-black text-white">
                  {profile.profile.publicProfileEnabled
                    ? 'Profile enabled'
                    : 'Profile disabled'}
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              The profile is publicly reachable only when leaderboard opt-in is
              enabled, the profile is enabled, a slug exists, and you have an
              eligible IQ Score.
            </p>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-400/10 text-amber-100">
                <Trophy size={22} strokeWidth={2} />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Leaderboard
                </p>
                <p className="text-lg font-black text-white">
                  {formatRank(profile.leaderboard.rank)}
                </p>
              </div>
            </div>

            <dl className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <dt className="font-bold text-slate-500">Public listing</dt>
                <dd className="mt-1 font-black text-white">
                  {profile.leaderboard.optIn ? 'Opted in' : 'Turned off'}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <dt className="font-bold text-slate-500">Eligible score</dt>
                <dd className="mt-1 font-black text-white">
                  {profile.leaderboard.eligible ? 'Available' : 'Not available'}
                </dd>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <dt className="font-bold text-slate-500">Profile visible</dt>
                <dd className="mt-1 font-black text-white">
                  {profile.leaderboard.publicProfileVisible ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </section>

          {profile.leaderboard.entry ? (
            <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Best public score
              </p>
              <p className="mt-3 text-6xl font-black tracking-tight text-white">
                {profile.leaderboard.entry.iqScore}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-500">
                IQMeridian IQ Score
              </p>
              <p className="mt-4 text-sm font-black text-slate-300">
                {formatScoreBand(profile.leaderboard.entry.scoreBand)}
              </p>
            </section>
          ) : null}
        </aside>

        <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/82 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.22)]">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
              <UserRound size={22} strokeWidth={2} />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Editable profile
              </p>
              <h2 className="text-2xl font-black text-white">
                Public-facing information
              </h2>
            </div>
          </div>
          Change the form tag to:
          <form
            action={updatePublicProfileAction}
            className="mt-6 space-y-5"
            encType="multipart/form-data"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <label className="flex items-start gap-3">
                <input
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-[#020817]"
                  defaultChecked={profile.profile.publicProfileEnabled}
                  name="publicProfileEnabled"
                  type="checkbox"
                  value="true"
                />
                <span>
                  <span className="block text-sm font-black text-white">
                    Enable public profile
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-400">
                    The profile only becomes visible when leaderboard opt-in is
                    also enabled and an eligible score exists.
                  </span>
                </span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-slate-300">
                  Display name
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
                  defaultValue={profile.profile.displayName ?? ''}
                  maxLength={40}
                  name="displayName"
                  placeholder="Cipher Nyx"
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-300">
                  Profile slug
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold lowercase text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
                  defaultValue={profile.profile.profileSlug ?? ''}
                  maxLength={60}
                  name="profileSlug"
                  placeholder="cipher-nyx"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Lowercase letters, numbers, and hyphens only.
                </span>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-black text-slate-300">
                Headline / status
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
                defaultValue={profile.profile.headline ?? ''}
                maxLength={90}
                name="headline"
                placeholder="Independent problem solver and IQMeridian top-ranked profile"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-300">Bio</span>
              <textarea
                className="mt-2 min-h-36 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
                defaultValue={profile.profile.bio ?? ''}
                maxLength={600}
                name="bio"
                placeholder="Write a short public bio..."
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-slate-300">Quote</span>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
                defaultValue={profile.profile.quote ?? ''}
                maxLength={180}
                name="quote"
                placeholder="A line people will associate with your profile"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-black text-slate-300">
                  Public location
                </span>
                <input
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
                  defaultValue={profile.profile.location ?? ''}
                  maxLength={80}
                  name="location"
                  placeholder="St. Louis, USA"
                />
                <span className="mt-1 block text-xs text-slate-500">
                  Use broad location only. Do not enter exact address.
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-black text-slate-300">
                  Profile image
                </span>

                <input
                  name="existingAvatarUrl"
                  type="hidden"
                  value={profile.profile.avatarUrl ?? ''}
                />

                {profile.profile.avatarUrl ? (
                  <div className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <span className="flex h-14 w-14 overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-400/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={profile.profile.avatarUrl}
                      />
                    </span>
                    <span className="text-xs font-bold leading-5 text-slate-400">
                      Current uploaded profile image. Choose a new file below to
                      replace it.
                    </span>
                  </div>
                ) : null}

                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 text-sm font-bold text-white outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:text-sm file:font-black file:text-slate-950 hover:file:bg-cyan-300"
                  name="avatarFile"
                  type="file"
                />

                <span className="mt-1 block text-xs text-slate-500">
                  Upload JPG, PNG, or WEBP. Maximum size: 2MB.
                </span>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-black text-slate-300">
                Website / social link
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-[#020817] px-4 py-3 focus-within:border-cyan-300/40">
                <Globe2
                  className="shrink-0 text-slate-500"
                  size={18}
                  strokeWidth={2}
                />
                <input
                  className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-slate-600"
                  defaultValue={profile.profile.websiteUrl ?? ''}
                  maxLength={500}
                  name="websiteUrl"
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
            </label>

            <div className="rounded-2xl border border-cyan-300/10 bg-cyan-400/10 p-4 text-xs leading-6 text-cyan-100">
              <div className="flex gap-2">
                <ShieldCheck
                  className="mt-0.5 shrink-0"
                  size={16}
                  strokeWidth={2}
                />
                <p>
                  Only the fields on this form can appear publicly. Do not enter
                  sensitive private information. Use broad public location, not
                  exact address.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                type="submit"
              >
                Save public profile
              </button>

              <Link
                className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
                href="/leaderboard"
              >
                View leaderboard
              </Link>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
