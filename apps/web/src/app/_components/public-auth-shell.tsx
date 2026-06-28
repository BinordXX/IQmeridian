import { BrainCircuit, ShieldCheck, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  AmbientSignalConduit,
  PublicCursorGlow,
  PublicReveal,
  ScrollProgressBar,
} from './public-homepage-effects';
import { PublicSiteNav } from './public-site-nav';

type PublicAuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  sideTitle: string;
  sideDescription: string;
  proofPoints: string[];
};

export function PublicAuthShell({
  eyebrow,
  title,
  description,
  children,
  sideTitle,
  sideDescription,
  proofPoints,
}: PublicAuthShellProps) {
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

        <section className="relative mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <AmbientSignalConduit className="left-[38%] top-24 rotate-3 opacity-45" />
          <AmbientSignalConduit className="bottom-20 right-8 -rotate-6 opacity-55" />

          <PublicReveal>
            <div className="relative overflow-hidden rounded-[2.25rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(3,7,18,0.94))] p-7 shadow-[0_30px_100px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:p-9">
              <div
                aria-hidden="true"
                className="absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]"
              />
              <div
                aria-hidden="true"
                className="absolute bottom-[-8rem] left-[-6rem] h-72 w-72 rounded-full bg-blue-500/10 blur-[100px]"
              />

              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.18)]">
                  <BrainCircuit size={27} strokeWidth={2.2} />
                </div>

                <p className="mt-8 text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
                  {eyebrow}
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
                  {description}
                </p>

                <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                      <ShieldCheck size={19} strokeWidth={2.3} />
                    </span>
                    <div>
                      <h2 className="text-sm font-black text-white">
                        {sideTitle}
                      </h2>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {sideDescription}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {proofPoints.map((point) => (
                      <div
                        className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                        key={point}
                      >
                        <Sparkles
                          className="mt-1 shrink-0 text-cyan-300"
                          size={15}
                          strokeWidth={2.3}
                        />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </PublicReveal>

          <PublicReveal delay={120}>
            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute -inset-5 -z-10 rounded-[2.5rem] bg-cyan-400/10 blur-3xl"
              />
              {children}
            </div>
          </PublicReveal>
        </section>
      </div>
    </main>
  );
}