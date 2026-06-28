import { CheckCircle2, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  AmbientSignalConduit,
  PublicCursorGlow,
  PublicReveal,
  ScrollProgressBar,
} from './public-homepage-effects';
import { PublicSiteNav } from './public-site-nav';

type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

type PublicCardProps = {
  children: ReactNode;
  className?: string;
};

type PublicSectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

type PublicMetricProps = {
  value: string;
  label: string;
  description: string;
};

export function PublicPageShell({
  eyebrow,
  title,
  description,
  children,
}: PublicPageShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white selection:bg-cyan-400/30 selection:text-white">
      <ScrollProgressBar />
      <PublicCursorGlow />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_85%_12%,rgba(59,130,246,0.14),transparent_22%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.12),transparent_26%)]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute right-[-8rem] top-[28rem] h-[24rem] w-[24rem] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
        <PublicSiteNav />

        <section className="relative mx-auto max-w-7xl overflow-hidden px-6 py-20 lg:py-28">
          <AmbientSignalConduit className="right-8 top-16 rotate-6 opacity-50" />

          <PublicReveal>
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.34em] text-cyan-300">
                {eyebrow}
              </p>
              <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl">
                {title}
              </h1>
              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                {description}
              </p>
            </div>
          </PublicReveal>
        </section>

        <div className="relative mx-auto max-w-7xl px-6 pb-24">
          <AmbientSignalConduit className="left-4 top-10 -rotate-3 opacity-35" />

          <PublicReveal className="relative z-10">{children}</PublicReveal>
        </div>

        <footer className="border-t border-white/10 bg-[#050b21]/70">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100">
                  <Fingerprint size={22} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.28em]">
                    IQMeridian
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Structured cognitive assessment infrastructure.
                  </p>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-500">
                IQMeridian’s current scoring outputs are provisional. Formal
                norming, calibration, reliability validation, and reporting
                governance are required before high-stakes interpretation.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-400">
              <Link className="hover:text-cyan-300" href="/about">
                About
              </Link>
              <Link className="hover:text-cyan-300" href="/pricing">
                Pricing
              </Link>
              <Link className="hover:text-cyan-300" href="/resources">
                Resources
              </Link>
              <Link className="hover:text-cyan-300" href="/api">
                API
              </Link>
              <Link className="hover:text-cyan-300" href="/privacy">
                Privacy
              </Link>
              <Link className="hover:text-cyan-300" href="/terms">
                Terms
              </Link>
              <Link className="hover:text-cyan-300" href="/contact">
                Contact
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

export function PublicCard({ children, className = '' }: PublicCardProps) {
  return (
    <section
      className={[
        'rounded-[2rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(3,7,18,0.92))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-[0_20px_70px_rgba(34,211,238,0.14)]',
        className,
      ].join(' ')}
    >
      {children}
    </section>
  );
}

export function PublicSectionHeading({
  eyebrow,
  title,
  description,
}: PublicSectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-white">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-7 text-slate-400">{description}</p>
    </div>
  );
}

export function PublicBulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-6 grid gap-3">
      {items.map((item) => (
        <li className="flex gap-3 text-sm leading-7 text-slate-300" key={item}>
          <CheckCircle2
            className="mt-1 shrink-0 text-cyan-300"
            size={17}
            strokeWidth={2.3}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PublicMetric({
  value,
  label,
  description,
}: PublicMetricProps) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/20">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
        {label}
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}