'use client';
import { PublicSiteNav } from './_components/public-site-nav';
import {
  AmbientSignalConduit,
  AnimatedNumber,
  HeroSignalParticles,
  MagneticLink,
  PublicCursorGlow,
  ScrollProgressBar,
  SignalConsole,
  TimelineRail,
} from './_components/public-homepage-effects';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  DatabaseZap,
  Fingerprint,
  Gauge,
  GraduationCap,
  LineChart,
  LockKeyhole,
  Menu,
  Network,
  Radar,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {
  MouseEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const productPillars = [
  {
    title: 'Adaptive assessment engine',
    description:
      'Deliver structured cognitive assessments with timing, omissions, item telemetry, and score-ready response records.',
    icon: BrainCircuit,
  },
  {
    title: 'Psychometric scoring pipeline',
    description:
      'Transform sessions into provisional profiles using raw score, domain behaviour, timing evidence, validity flags, and IRT-style estimates.',
    icon: LineChart,
  },
  {
    title: 'Candidate intelligence profile',
    description:
      'Present standard score, percentile, strongest domains, score band, attempt quality, and score interval language in one dashboard.',
    icon: Gauge,
  },
  {
    title: 'Research governance layer',
    description:
      'Support item analysis, suspicious-session review, audit trails, export approvals, and calibration-readiness workflows.',
    icon: ShieldCheck,
  },
];

const platformStats = [
  {
    value: '3',
    label: 'core workspaces',
    detail: 'Candidate, employer, and internal research views.',
  },
  {
    value: 'IRT',
    label: 'provisional model',
    detail: 'Built to mature toward calibrated psychometric estimates.',
  },
  {
    value: 'RBAC',
    label: 'protected access',
    detail:
      'Role-aware routing across users, employers, researchers, and admins.',
  },
  {
    value: 'Audit',
    label: 'governance trail',
    detail: 'Sensitive platform actions are designed to be traceable.',
  },
];

const audienceCards = [
  {
    title: 'For candidates',
    description:
      'Take structured assessments, review score profiles, and understand your current IQMeridian result with validity-aware interpretation.',
    icon: UsersRound,
    bullets: [
      'Guided assessment flow',
      'Profile dashboard',
      'Attempt history',
      'Validity-aware score language',
    ],
  },
  {
    title: 'For employers',
    description:
      'Invite candidates, organise campaigns, and prepare for structured intelligence reporting through protected employer workflows.',
    icon: Building2,
    bullets: [
      'Campaign structure',
      'Candidate invitations',
      'Assessment status tracking',
      'Future hiring intelligence reports',
    ],
  },
  {
    title: 'For researchers',
    description:
      'Inspect item behaviour, response quality, suspicious patterns, scoring outputs, and export governance from internal tooling.',
    icon: GraduationCap,
    bullets: [
      'Item performance review',
      'Suspicious-session inspection',
      'Export request governance',
      'Audit-backed research workflows',
    ],
  },
];

const processSteps = [
  {
    title: 'Assessment begins',
    description:
      'A user enters a controlled assessment flow with timed sections, response tracking, and session-state protection.',
    icon: ClipboardCheck,
  },
  {
    title: 'Signals are captured',
    description:
      'Responses, omissions, correctness, item metadata, and timing context become structured evidence.',
    icon: DatabaseZap,
  },
  {
    title: 'Profile emerges',
    description:
      'The scoring pipeline generates raw, domain, validity, percentile, and standard-score outputs.',
    icon: BarChart3,
  },
  {
    title: 'Governance improves it',
    description:
      'Researchers inspect item quality, flag weak attempts, and prepare the system for norming and calibration.',
    icon: Radar,
  },
];

const governanceItems = [
  'Role-based access for consumers, candidates, employers, researchers, and platform administrators.',
  'Audit logging for authentication, assessment completion, scoring, export governance, and internal review actions.',
  'Validity flags for omissions, low response-time coverage, timing irregularity, and weak attempt quality.',
  'Designed for formal calibration, norming, reliability validation, and report governance before public IQ claims.',
];

const staffMembers = [
  {
    name: 'Binord Francis',
    role: 'Founder & Chief Executive Officer',
    description:
      'Leads IQMeridian’s product vision, intelligence-assessment strategy, and long-term platform direction.',
    initials: 'BF',
  },
  {
    name: 'Dr. Amara Okoye',
    role: 'Chief Psychometrics Officer',
    description:
      'Mock profile. Oversees assessment design, item-quality review, validity research, and calibration methodology.',
    initials: 'AO',
  },
  {
    name: 'Michael Adeyemi',
    role: 'Chief Technology Officer',
    description:
      'Mock profile. Guides platform architecture, scoring infrastructure, data security, and engineering execution.',
    initials: 'MA',
  },
  {
    name: 'Sarah Mitchell',
    role: 'Head of Research Governance',
    description:
      'Mock profile. Coordinates audit review, data export governance, ethics workflows, and research quality assurance.',
    initials: 'SM',
  },
];

const faqItems = [
  {
    question: 'Is IQMeridian already a certified IQ test?',
    answer:
      'No. The current platform is a serious psychometric infrastructure with provisional scoring. Formal IQ claims require calibration, norming, reliability validation, and governance review.',
  },
  {
    question: 'Why does the platform show validity flags?',
    answer:
      'A score is only useful when the attempt quality is understood. Omissions, timing gaps, rapid patterns, or low precision can reduce interpretive confidence.',
  },
  {
    question: 'Can employers use it for high-stakes decisions now?',
    answer:
      'Employer workflows are being built, but high-stakes hiring use should wait until calibration, adverse-impact review, reporting governance, and validation are complete.',
  },
  {
    question: 'What makes IQMeridian different?',
    answer:
      'IQMeridian combines assessment delivery, score persistence, candidate dashboards, internal tooling, export governance, and a path toward calibrated intelligence reporting.',
  },
];

const heroShapes = [
  {
    className: 'left-[9%] top-[18%] h-5 w-5 rounded-full bg-cyan-300',
    factor: 0.035,
  },
  {
    className:
      'left-[23%] top-[13%] h-0 w-0 border-b-[28px] border-l-[18px] border-r-[18px] border-b-amber-300 border-l-transparent border-r-transparent',
    factor: -0.025,
  },
  {
    className:
      'right-[17%] top-[17%] h-0 w-0 rotate-12 border-b-[34px] border-l-[22px] border-r-[22px] border-b-emerald-400 border-l-transparent border-r-transparent',
    factor: 0.027,
  },
  {
    className:
      'right-[6%] top-[34%] h-0 w-0 rotate-45 border-b-[46px] border-l-[30px] border-r-[30px] border-b-sky-400 border-l-transparent border-r-transparent',
    factor: -0.018,
  },
  {
    className:
      'left-[17%] bottom-[22%] h-0 w-0 rotate-[105deg] border-b-[40px] border-l-[28px] border-r-[28px] border-b-teal-300 border-l-transparent border-r-transparent',
    factor: 0.022,
  },
  {
    className:
      'right-[24%] bottom-[18%] h-0 w-0 rotate-[72deg] border-b-[34px] border-l-[22px] border-r-[22px] border-b-fuchsia-400 border-l-transparent border-r-transparent',
    factor: -0.03,
  },
];

const sectionPanelClassName =
  'relative overflow-hidden border-y border-white/10 bg-[linear-gradient(180deg,rgba(12,19,49,0.92),rgba(3,8,27,0.98))] shadow-[0_30px_110px_rgba(0,0,0,0.4)]';

const insetPanelClassName =
  'relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,27,67,0.86),rgba(4,10,30,0.96))] shadow-[0_25px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl';

const glassCardClassName =
  'iqm-glass-card h-full rounded-[1.5rem] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(3,7,18,0.92))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-[0_20px_70px_rgba(34,211,238,0.14)]';

const mutedGlassCardClassName =
  'rounded-[1.25rem] border border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-lg';

const primaryButtonClassName =
  'iqm-glow-button inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-6 py-3 text-sm font-semibold text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_12px_40px_rgba(34,211,238,0.18)] backdrop-blur-md transition duration-300 hover:scale-[1.02] hover:bg-cyan-400/15 hover:shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_18px_48px_rgba(34,211,238,0.24)]';

const secondaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:border-cyan-300/30 hover:text-cyan-200';

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      {
        rootMargin: '-8% 0px -12% 0px',
        threshold: 0.14,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`iqm-reveal ${className}`}
      data-visible={visible ? 'true' : 'false'}
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function KineticText({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState(text);

  const glyphs = useMemo(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789◇△◌◆', []);

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          setVisible(true);
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let frame = 0;
    const maxFrames = 32;

    const interval = window.setInterval(() => {
      frame += 1;

      setDisplayText(
        text
          .split('')
          .map((letter, index) => {
            if (letter === ' ') {
              return ' ';
            }

            const revealThreshold = (index / text.length) * maxFrames;

            if (frame > revealThreshold + 8) {
              return letter;
            }

            return glyphs[Math.floor(Math.random() * glyphs.length)];
          })
          .join('')
      );

      if (frame >= maxFrames) {
        setDisplayText(text);
        window.clearInterval(interval);
      }
    }, 34);

    return () => window.clearInterval(interval);
  }, [glyphs, text, visible]);

  return (
    <h1
      className="iqm-kinetic mt-8 max-w-5xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl"
      data-visible={visible ? 'true' : 'false'}
      ref={ref}
    >
      {displayText}
    </h1>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-slate-300">{description}</p>
    </div>
  );
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="mx-auto mt-14 grid max-w-4xl gap-4">
      {faqItems.map((item, index) => {
        const isOpen = openIndex === index;

        return (
          <article
            className={`${mutedGlassCardClassName} overflow-hidden p-6 transition hover:border-cyan-300/20`}
            key={item.question}
          >
            <button
              className="flex w-full items-center justify-between gap-6 text-left"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              type="button"
            >
              <span className="text-lg font-black text-white">
                {item.question}
              </span>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-cyan-200">
                {isOpen ? (
                  <X size={17} strokeWidth={2.3} />
                ) : (
                  <ChevronRight size={17} strokeWidth={2.3} />
                )}
              </span>
            </button>

            <div
              className={`grid transition-all duration-300 ${
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {item.answer}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function HomePage() {
 
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const handleHeroPointerMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setPointer({
      x: event.clientX - rect.left - rect.width / 2,
      y: event.clientY - rect.top - rect.height / 2,
    });
  };

  const handleCardPointerMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    event.currentTarget.style.setProperty('--iqm-card-x', `${x}%`);
    event.currentTarget.style.setProperty('--iqm-card-y', `${y}%`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] text-white selection:bg-cyan-400/30 selection:text-white">
      <ScrollProgressBar />
      <PublicCursorGlow />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_85%_12%,rgba(59,130,246,0.14),transparent_22%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.12),transparent_26%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.15),rgba(2,6,23,0.92))]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute right-[-8rem] top-[28rem] h-[24rem] w-[24rem] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10">
       <section
  className="relative isolate min-h-screen overflow-hidden bg-[#080d28]"
  onMouseMove={handleHeroPointerMove}
>
<div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,_#05091f_0%,_#0b1231_42%,_#111b46_72%,_#17245c_100%)]" />
<div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_20%,rgba(45,212,255,0.10),transparent_24%),radial-gradient(circle_at_86%_44%,rgba(59,130,246,0.13),transparent_24%)]" />
<div className="iqm-neural-grid absolute inset-0 -z-10 opacity-35" />
<div className="pointer-events-none absolute left-[51.8%] top-[18%] z-0 hidden h-[30rem] w-44 -translate-x-1/2 lg:block">
  <div className="absolute inset-y-0 left-1/2 w-20 -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.14),rgba(34,211,238,0.04)_36%,transparent_74%)]" />

  <div className="absolute left-1/2 top-8 h-[23rem] w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-transparent via-cyan-300/70 to-transparent shadow-[0_0_24px_rgba(34,211,238,0.22)]" />

  <div className="iqm-data-node absolute left-1/2 top-20 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
  <div className="iqm-data-branch absolute left-[50%] top-[5rem] h-px w-14 -translate-y-1/2 -translate-x-full bg-gradient-to-l from-cyan-300/60 to-transparent" />
  <div className="iqm-data-branch absolute left-[50%] top-[5rem] h-px w-20 -translate-y-1/2 bg-gradient-to-r from-cyan-300/60 to-transparent" />

  <div className="iqm-data-node absolute left-1/2 top-44 h-4 w-4 -translate-x-1/2 rounded-[0.35rem] border border-cyan-300/50 bg-[#102a58]/90 shadow-[0_0_16px_rgba(34,211,238,0.45)]" />
  <div className="iqm-data-branch absolute left-[50%] top-44 h-px w-10 -translate-y-1/2 -translate-x-full bg-gradient-to-l from-cyan-300/50 to-transparent" />
  <div className="iqm-data-branch absolute left-[50%] top-44 h-px w-24 -translate-y-1/2 bg-gradient-to-r from-cyan-300/65 to-transparent" />

  <div className="iqm-data-node absolute left-1/2 top-[15.8rem] h-3 w-3 -translate-x-1/2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.7)]" />
  <div className="iqm-data-branch absolute left-[50%] top-[15.8rem] h-px w-16 -translate-y-1/2 -translate-x-full bg-gradient-to-l from-emerald-300/45 to-transparent" />
  <div className="iqm-data-branch absolute left-[50%] top-[15.8rem] h-px w-12 -translate-y-1/2 bg-gradient-to-r from-emerald-300/45 to-transparent" />

  <div className="iqm-data-node absolute left-1/2 top-[21rem] h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-sky-300 shadow-[0_0_18px_rgba(125,211,252,0.75)]" />
  <div className="iqm-data-branch absolute left-[50%] top-[21rem] h-px w-12 -translate-y-1/2 -translate-x-full bg-gradient-to-l from-sky-300/45 to-transparent" />
  <div className="iqm-data-branch absolute left-[50%] top-[21rem] h-px w-18 -translate-y-1/2 bg-gradient-to-r from-sky-300/55 to-transparent" />

  <div className="iqm-data-pulse absolute left-1/2 top-10 h-12 w-12 -translate-x-1/2 rounded-full border border-cyan-300/35 bg-cyan-300/10 shadow-[0_0_30px_rgba(34,211,238,0.22)]" />
</div>
<div className="absolute bottom-[-8rem] right-[-8rem] -z-10 h-[26rem] w-[26rem] rounded-full bg-blue-500/10 blur-[120px]" />

          {heroShapes.map((shape, index) => (
            <span
              className={`absolute z-0 opacity-80 blur-[0.2px] ${
                index % 2 === 0 ? 'iqm-drift' : 'iqm-drift-reverse'
              } ${shape.className}`}
              key={shape.className}
              style={{
                transform: `translate3d(${pointer.x * shape.factor}px, ${
                  pointer.y * shape.factor
                }px, 0)`,
              }}
            />
          ))}
          <HeroSignalParticles />

         <PublicSiteNav />

          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-32 lg:pt-20">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-blue-50 shadow-2xl shadow-blue-950/30 backdrop-blur">
                <Sparkles size={16} strokeWidth={2.2} />
                Intelligence testing with scientific restraint
              </div>

              <KineticText text="Measure intelligence with structure, validity, and precision." />

              <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-50/75">
                IQMeridian combines assessment delivery, psychometric scoring,
                validity diagnostics, candidate dashboards, employer workflows,
                and research governance into one evolving intelligence platform.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
  <MagneticLink className={primaryButtonClassName} href="/register">
    Create account
    <ArrowRight size={17} strokeWidth={2.4} />
  </MagneticLink>

  <MagneticLink className={secondaryButtonClassName} href="/employers/apply">
    Request employer access
    <ChevronRight size={17} strokeWidth={2.4} />
  </MagneticLink>

  <MagneticLink className={secondaryButtonClassName} href="#platform">
    Explore platform
    <ChevronRight size={17} strokeWidth={2.4} />
  </MagneticLink>
</div>

              <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
                {[
                  'Provisional IRT-style scoring',
                  'Validity-aware reporting',
                  'Role-protected dashboards',
                ].map((item) => (
                  <div
                    className="iqm-glass-card flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-semibold text-blue-50/85 backdrop-blur"
                    key={item}
                    onMouseMove={handleCardPointerMove}
                  >
                    <CheckCircle2
                      className="shrink-0 text-cyan-300"
                      size={17}
                      strokeWidth={2.3}
                    />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
             <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-cyan-400/8 blur-2xl" />

              <div
               className="iqm-glass-card iqm-scan-card rounded-[2rem] border border-cyan-300/15 bg-[#0a102c]/85 p-4 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl"
                onMouseMove={handleCardPointerMove}
              >
                <div className="rounded-[1.5rem] border border-cyan-300/10 bg-[#060b22]/95 p-5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                        Live profile preview
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-white">
                        Cognitive signal map
                      </h3>
                    </div>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      Scored
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {[
                      ['Standard score', '99'],
                      ['Percentile', '48th'],
                      ['Accuracy', '67%'],
                      ['Attempt quality', 'Caution'],
                    ].map(([label, value]) => (
                      <div
                        className="rounded-2xl border border-white/10 bg-white/[0.06] p-4"
                        key={label}
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/60">
                          {label}
                        </p>
                        <p className="mt-2 text-3xl font-black text-white">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-200">
                        <Network size={20} strokeWidth={2.3} />
                      </span>
                      <div>
                        <p className="font-bold text-white">
                          Domain profile generated
                        </p>
                        <p className="text-sm text-blue-50/65">
                          Abstract reasoning, numerical reasoning, timing
                          behaviour, and validity indicators.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {[
                      ['Abstract reasoning', '72%', 'w-[72%]'],
                      ['Numerical reasoning', '61%', 'w-[61%]'],
                      ['Response coverage', 'Improving', 'w-[54%]'],
                    ].map(([label, value, width]) => (
                      <div key={label}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-blue-50/70">{label}</span>
                          <span className="font-bold text-white">{value}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full bg-cyan-400 ${width}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -left-6 hidden rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/60">
                  Governance
                </p>
                <p className="mt-1 text-lg font-black text-white">
                  Audit-ready
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={sectionPanelClassName}>
          <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-4">
            {platformStats.map((stat, index) => (
              <Reveal delay={index * 90} key={stat.label}>
                <div className={`${mutedGlassCardClassName} p-5`}>
                  <p className="text-3xl font-black text-white">
                    {stat.value === '3' ? (
                      <AnimatedNumber value={3} />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <p className="mt-1 text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {stat.detail}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section
  className={`${sectionPanelClassName} relative overflow-hidden`}
  id="platform"
>
  <AmbientSignalConduit className="right-8 top-8 rotate-6 opacity-60" />

  <div className="relative z-10 mx-auto max-w-7xl px-6 py-24">
            <Reveal>
              <SectionHeading
                eyebrow="Platform"
                title="A full-stack intelligence assessment system, not a simple quiz."
                description="IQMeridian is being built around structured assessment delivery, score computation, validity diagnostics, user dashboards, and research-grade governance."
              />
            </Reveal>

            <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {productPillars.map((pillar, index) => {
                const Icon = pillar.icon;

                return (
                  <Reveal delay={index * 90} key={pillar.title}>
                    <article
                      className={glassCardClassName}
                      onMouseMove={handleCardPointerMove}
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 transition group-hover:scale-105">
                        <Icon size={22} strokeWidth={2.2} />
                      </span>
                      <h3 className="mt-6 text-lg font-bold text-white">
                        {pillar.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {pillar.description}
                      </p>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className={sectionPanelClassName}>
          <div className="mx-auto max-w-7xl px-6 py-24">
            <Reveal>
              <SectionHeading
                eyebrow="Users"
                title="Designed for every side of the assessment workflow."
                description="Different users need different interfaces. IQMeridian separates candidate, employer, researcher, and administrative concerns instead of forcing everyone into one generic dashboard."
              />
            </Reveal>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {audienceCards.map((card, index) => {
                const Icon = card.icon;

                return (
                  <Reveal delay={index * 120} key={card.title}>
                    <article className={glassCardClassName}>
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                        <Icon size={24} strokeWidth={2.2} />
                      </span>
                      <h3 className="mt-6 text-2xl font-black tracking-tight text-white">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-slate-300">
                        {card.description}
                      </p>

                      <ul className="mt-6 space-y-3">
                        {card.bullets.map((bullet) => (
                          <li
                            className="flex items-center gap-3 text-sm font-semibold text-slate-300"
                            key={bullet}
                          >
                            <BadgeCheck
                              className="text-cyan-300"
                              size={17}
                              strokeWidth={2.2}
                            />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className={sectionPanelClassName} id="scrollytelling">
          <AmbientSignalConduit className="right-10 top-10 -rotate-6 opacity-65" />
<AmbientSignalConduit className="bottom-16 left-10 rotate-3 opacity-45" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(45,212,255,0.14),_transparent_42%)]" />
            <div className="relative lg:sticky lg:top-24 lg:h-fit">
              <Reveal>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">
                  Dynamic system
                </p>
                <h2 className="mt-4 text-4xl font-black tracking-tight text-white">
                  The page builds like the product: signal by signal.
                </h2>
                <p className="mt-5 text-base leading-8 text-slate-300">
                  As visitors scroll, the assessment system unfolds from
                  session capture to scoring, interpretation, and governance.
                  This gives the homepage a GitHub-style progressive build feel
                  without sacrificing performance.
                </p>
              </Reveal>

              <div className="mt-8 rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,28,76,0.78),rgba(9,17,48,0.94))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                <div className="relative h-72 overflow-hidden rounded-[1.5rem] bg-[#10163a]">
                  <div className="iqm-neural-grid absolute inset-0 opacity-80" />
                  <div className="iqm-floating-line absolute left-[18%] top-[70%] h-20 w-px bg-cyan-300/40" />
                  <div className="iqm-floating-line absolute left-[48%] top-[64%] h-28 w-px bg-blue-300/35 [animation-delay:1.2s]" />
                  <div className="iqm-floating-line absolute left-[72%] top-[68%] h-24 w-px bg-emerald-300/30 [animation-delay:2.1s]" />
                  <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/30 bg-cyan-300/10 shadow-2xl shadow-cyan-500/20" />
                  <div className="absolute left-[24%] top-[30%] h-5 w-5 rounded-full bg-cyan-300 shadow-lg shadow-cyan-300/30" />
                  <div className="absolute right-[22%] top-[36%] h-4 w-4 rounded-full bg-emerald-300 shadow-lg shadow-emerald-300/30" />
                  <div className="absolute bottom-[24%] left-[38%] h-4 w-4 rounded-full bg-fuchsia-300 shadow-lg shadow-fuchsia-300/30" />
                </div>
              </div>
            </div>

            <div className="relative grid gap-5 lg:pl-8">
              <TimelineRail />
              {processSteps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <Reveal delay={index * 110} key={step.title}>
                    <article className={glassCardClassName}>
                      <div className="flex gap-5">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-[#071022]">
                          <Icon size={22} strokeWidth={2.2} />
                        </span>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                            {String(index + 1).padStart(2, '0')}
                          </p>
                          <h3 className="mt-2 text-2xl font-black text-white">
                            {step.title}
                          </h3>
                          <p className="mt-3 text-sm leading-7 text-slate-300">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        <section
  className={`${sectionPanelClassName} relative overflow-hidden`}
  id="governance"
>
  <AmbientSignalConduit className="right-16 top-12 rotate-2 opacity-55" />

  <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <Reveal>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">
                  Governance
                </p>
                <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Serious assessment requires controls, not just attractive
                  charts.
                </h2>
                <p className="mt-5 text-base leading-8 text-slate-300">
                  IQMeridian is being shaped as a credible assessment platform.
                  The system separates user roles, audit-sensitive workflows,
                  scoring outputs, and research-facing internal tooling.
                </p>
              </div>
            </Reveal>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl">
              <div className="grid gap-4">
                {governanceItems.map((item, index) => (
                  <Reveal delay={index * 80} key={item}>
                    <div className="flex gap-4 rounded-2xl border border-cyan-400/15 bg-[#07142f]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-lg">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                        <LockKeyhole size={17} strokeWidth={2.2} />
                      </span>
                      <p className="text-sm leading-7 text-slate-300">{item}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={sectionPanelClassName} id="team">
          <AmbientSignalConduit className="left-12 top-10 -rotate-3 opacity-45" />
          <div className="mx-auto max-w-7xl px-6 py-24">
            <Reveal>
              <SectionHeading
                eyebrow="Leadership"
                title="Built by a product team focused on credible intelligence infrastructure."
                description="The extended leadership profiles below use mock data where noted. They provide a professional public-site structure while the real team is finalised."
              />
            </Reveal>

            <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {staffMembers.map((member, index) => (
                <Reveal delay={index * 100} key={member.name}>
                  <article className={glassCardClassName}>
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-2xl font-black text-cyan-100 shadow-xl shadow-cyan-950/30">
                      {member.initials}
                    </div>
                    <h3 className="mt-6 text-xl font-black text-white">
                      {member.name}
                    </h3>
                    <p className="mt-2 text-sm font-bold text-cyan-300">
                      {member.role}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-slate-300">
                      {member.description}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className={sectionPanelClassName}>
          <div className="mx-auto max-w-7xl px-6 py-24">
            <Reveal>
              <div className={`${insetPanelClassName} p-8 lg:p-12`}>
                <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-300">
                      Demo preview
                    </p>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
                      A premium SaaS feel before users ever enter the test room.
                    </h2>
                    <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                      This placeholder can later become a Lottie, Spline, or
                      video walkthrough showing assessment launch, scoring, and
                      profile generation.
                    </p>
                  </div>

                  <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(16,24,64,0.92),rgba(3,8,25,0.96))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
                    <SignalConsole />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className={sectionPanelClassName} id="faq">
          <AmbientSignalConduit className="right-12 top-8 rotate-6 opacity-45" />
          <div className="mx-auto max-w-7xl px-6 py-24">
            <Reveal>
              <SectionHeading
                eyebrow="FAQ"
                title="Clear answers before users register."
                description="Visitors should understand what IQMeridian is, what it can already do, and what still requires formal validation."
              />
            </Reveal>

            <Reveal>
              <FaqAccordion />
            </Reveal>
          </div>
        </section>

        <footer className="bg-[#070b1f] px-6 py-12 text-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 border-t border-white/10 pt-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                  <Fingerprint size={22} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.28em]">
                    IQMeridian
                  </p>
                  <p className="mt-1 text-xs text-blue-50/50">
                    Intelligence assessment infrastructure.
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-xl text-sm leading-7 text-blue-50/50">
                Provisional scoring outputs are not final clinical,
                educational, or employment decisions. Formal norming and
                validation are required before high-stakes interpretation.
              </p>
            </div>

<div className="flex flex-wrap gap-3">
  <Link
    className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-blue-50/75 transition hover:bg-white/10 hover:text-white"
    href="/login"
  >
    Sign in
  </Link>

  <Link
    className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-blue-50/75 transition hover:bg-white/10 hover:text-white"
    href="/employers/apply"
  >
    Request employer access
  </Link>

  <Link className={primaryButtonClassName} href="/register">
    Create account
  </Link>
</div>
          </div>
        </footer>
      </div>
    </main>
  );
}
