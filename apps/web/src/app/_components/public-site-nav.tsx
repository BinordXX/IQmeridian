'use client';

import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  Code2,
  FileText,
  FlaskConical,
  Gauge,
  Landmark,
  LockKeyhole,
  LucideIcon,
  Menu,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

type PublicNavItem = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

type PublicNavGroup = {
  label: string;
  description: string;
  items: PublicNavItem[];
};

const navGroups: PublicNavGroup[] = [
  {
    label: 'Platform',
    description: 'Assessment, scoring, API, and security.',
    items: [
      {
        label: 'Homepage',
        description: 'Public overview of IQMeridian.',
        href: '/',
        icon: Sparkles,
      },
      {
        label: 'Pricing',
        description: 'Plans for individuals, employers, and research.',
        href: '/pricing',
        icon: Gauge,
      },
      {
        label: 'API',
        description: 'Developer and integration surface.',
        href: '/api',
        icon: Code2,
      },
      {
        label: 'Security',
        description: 'Access control, audit, and protection posture.',
        href: '/security',
        icon: LockKeyhole,
      },
    ],
  },
  {
    label: 'Solutions',
    description: 'For different IQMeridian users.',
    items: [
      {
        label: 'Candidates',
        description: 'Assessment workspace and score profiles.',
        href: '/about',
        icon: UserRound,
      },
      {
        label: 'Employers',
        description: 'Campaigns, invitations, and future reporting.',
        href: '/pricing',
        icon: Building2,
      },
      {
        label: 'Research governance',
        description: 'Calibration, validation, and controlled exports.',
        href: '/research-governance',
        icon: FlaskConical,
      },
      {
        label: 'Legal readiness',
        description: 'Terms, privacy, and usage boundaries.',
        href: '/terms',
        icon: Scale,
      },
    ],
  },
  {
    label: 'Resources',
    description: 'Guidance, research, and platform material.',
    items: [
      {
        label: 'Resources hub',
        description: 'Public knowledge and product education.',
        href: '/resources',
        icon: BookOpen,
      },
      {
        label: 'Research governance',
        description: 'Psychometric caution and validation pathway.',
        href: '/research-governance',
        icon: ShieldCheck,
      },
      {
        label: 'Privacy',
        description: 'Development-stage privacy placeholder.',
        href: '/privacy',
        icon: FileText,
      },
      {
        label: 'API',
        description: 'Developer-facing platform direction.',
        href: '/api',
        icon: Code2,
      },
    ],
  },
  {

  label: 'Company',
  description: 'About, careers, contact, privacy, and terms.',
  items: [
    {
      label: 'About',
      description: 'Mission, founder, and product direction.',
      href: '/about',
      icon: Landmark,
    },
    {
      label: 'Careers',
      description: 'Future team and hiring direction.',
      href: '/careers',
      icon: BriefcaseBusiness,
    },
    {
      label: 'Contact',
      description: 'Product, employer, and research enquiries.',
      href: '/contact',
      icon: ArrowRight,
    },
    {
      label: 'Privacy',
      description: 'Data handling and privacy policy placeholder.',
      href: '/privacy',
      icon: FileText,
    },
    {
      label: 'Terms',
      description: 'Usage boundaries and terms of service placeholder.',
      href: '/terms',
      icon: Scale,
    },
  ],
},
];

export function PublicSiteNav() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050b21]/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100 shadow-2xl shadow-cyan-950/20 backdrop-blur">
            <BrainCircuit size={23} strokeWidth={2.2} />
          </span>
          <span>
            <span className="block text-sm font-black uppercase tracking-[0.32em] text-white">
              IQMeridian
            </span>
            <span className="block text-xs text-slate-400">
              Intelligence assessment infrastructure
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navGroups.map((group) => {
            const isActive = activeGroup === group.label;

            return (
              <div
                className="relative"
                key={group.label}
                onFocus={() => setActiveGroup(group.label)}
                onMouseEnter={() => setActiveGroup(group.label)}
                onMouseLeave={() => setActiveGroup(null)}
              >
                <button
                  className={[
                    'flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-white/10 text-cyan-200'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white',
                  ].join(' ')}
                  type="button"
                >
                  {group.label}
                  <ChevronDown
                    className={[
                      'transition',
                      isActive ? 'rotate-180 text-cyan-200' : '',
                    ].join(' ')}
                    size={15}
                    strokeWidth={2.4}
                  />
                </button>

                {isActive ? (
                  <div className="absolute left-1/2 top-full mt-4 w-[34rem] -translate-x-1/2 rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/95 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
                    <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                        {group.label}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {group.description}
                      </p>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;

                        return (
                          <Link
                            className="group flex gap-3 rounded-2xl border border-transparent p-3 transition hover:border-cyan-300/15 hover:bg-cyan-300/10"
                            href={item.href}
                            key={`${group.label}-${item.href}-${item.label}`}
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-cyan-200 transition group-hover:border-cyan-300/30 group-hover:bg-cyan-300/10">
                              <Icon size={18} strokeWidth={2.2} />
                            </span>
                            <span>
                              <span className="block text-sm font-black text-white">
                                {item.label}
                              </span>
                              <span className="mt-1 block text-xs leading-5 text-slate-400">
                                {item.description}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            className="rounded-full px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-black text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_12px_40px_rgba(34,211,238,0.18)] backdrop-blur-md transition hover:scale-[1.02] hover:bg-cyan-400/15"
            href="/register"
          >
            Get started
            <ArrowRight size={16} strokeWidth={2.4} />
          </Link>
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white md:hidden"
          onClick={() => setMobileOpen((current) => !current)}
          type="button"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-white/10 bg-[#050b21]/95 px-6 py-5 backdrop-blur-2xl md:hidden">
          <div className="grid gap-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                  {group.label}
                </p>
                <div className="mt-2 grid gap-1">
                  {group.items.map((item) => (
                    <Link
                      className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                      href={item.href}
                      key={`${group.label}-mobile-${item.href}-${item.label}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="grid gap-2 border-t border-white/10 pt-4">
              <Link
                className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white"
                href="/login"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </Link>
              <Link
                className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-black text-cyan-100"
                href="/register"
                onClick={() => setMobileOpen(false)}
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}