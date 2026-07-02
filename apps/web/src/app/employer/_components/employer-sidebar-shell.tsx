'use client';

import {
  BarChart3,
  BriefcaseBusiness,
  FileDown,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  UserRound,
  UsersRound,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type EmployerSidebarShellProps = {
  children: ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
    organisationId?: string | null;
    organisationName?: string | null;
  };
};

type NavItem = {
  label: string;
  description: string;
  href: string;
  exact?: boolean;
  icon: LucideIcon;
  tone: string;
};

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    description: 'Organisation overview',
    href: '/employer/dashboard',
    exact: true,
    icon: LayoutDashboard,
    tone: 'border-blue-300/20 bg-blue-400/10 text-blue-100',
  },
  {
    label: 'Campaigns',
    description: 'Create and manage campaigns',
    href: '/employer/campaigns',
    icon: BriefcaseBusiness,
    tone: 'border-violet-300/20 bg-violet-400/10 text-violet-100',
  },
  {
    label: 'Candidates',
    description: 'Organisation participants',
    href: '/employer/participants',
    icon: UsersRound,
    tone: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
  },
  {
    label: 'Results',
    description: 'Reports and comparisons',
    href: '/employer/results',
    icon: BarChart3,
    tone: 'border-amber-300/20 bg-amber-400/10 text-amber-100',
  },
  {
    label: 'Exports',
    description: 'Downloadable data outputs',
    href: '/employer/exports',
    icon: FileDown,
    tone: 'border-indigo-300/20 bg-indigo-400/10 text-indigo-100',
  },
];

const getInitials = (name?: string | null, email?: string | null) => {
  const source = name?.trim() || email?.trim() || 'IQMeridian';

  const parts = source
    .replace(/@.*$/, '')
    .split(/[.\s_-]+/)
    .filter(Boolean);

  const first = parts[0]?.[0] ?? 'I';
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? 'Q';

  return `${first}${second}`.toUpperCase();
};

const isActivePath = (pathname: string, item: NavItem) => {
  if (item.exact) {
    return pathname === item.href;
  }

  if (item.href === '/employer/participants') {
    return (
      pathname === item.href ||
      pathname.startsWith(`${item.href}/`) ||
      pathname === '/employer/candidates'
    );
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
};

export function EmployerSidebarShell({
  children,
  user,
}: EmployerSidebarShellProps) {
  const pathname = usePathname();
  const initials = getInitials(user.name, user.email);
  const displayName = user.name || user.email || 'Employer admin';
  const role = user.role ?? 'EMPLOYER_ADMIN';
  const roleLabel = role.replace('_', ' ');
const organisationName =
  user.organisationName?.trim() || 'Organisation name unavailable';
const organisationId = user.organisationId?.trim() || 'No organisation ID';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020817] text-white selection:bg-cyan-400/30 selection:text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(2,8,23,1))]"
      />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-[#050b21]/88 shadow-[20px_0_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link href="/employer/dashboard" className="block">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
                IQMeridian
              </p>
              <h1 className="mt-2 text-xl font-black tracking-tight text-white">
                Employer workspace
              </h1>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Campaigns, participants, reports, and exports.
              </p>
            </Link>
          </div>

          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 bg-cover bg-center text-sm font-black text-cyan-100"
                style={
                  user.image
                    ? {
                        backgroundImage: `url(${user.image})`,
                      }
                    : undefined
                }
              >
                {user.image ? null : initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {user.email}
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-cyan-200">
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-3">
              <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-500">
                Associated organisation
              </p>
              <p className="mt-1 truncate text-sm font-bold text-slate-200">
  {organisationName}
</p>
<p className="mt-1 truncate font-mono text-[0.68rem] text-slate-500">
  {organisationId}
</p>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(pathname, item);

                return (
                  <Link
                    className={[
                      'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition',
                      isActive
                        ? 'border border-cyan-300/15 bg-cyan-400/10 text-white shadow-[0_18px_50px_rgba(34,211,238,0.08)]'
                        : 'border border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white',
                    ].join(' ')}
                    href={item.href}
                    key={item.href}
                  >
                    <span
                      className={[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                        item.tone,
                      ].join(' ')}
                    >
                      <Icon size={18} strokeWidth={2} />
                    </span>

                    <span className="min-w-0">
                      <span className="block font-black">{item.label}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500 group-hover:text-slate-400">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            <Link
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-black text-slate-300 transition hover:border-cyan-300/20 hover:bg-cyan-400/10 hover:text-cyan-100"
              href="/logout"
            >
              <LogOut size={17} strokeWidth={2} />
              <span>Sign out</span>
            </Link>
          </div>
        </div>
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#020817]/84 px-6 py-4 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                Employer campaign and reporting workspace
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Manage campaigns, organisation participants, reports, and exports.
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                Organisation:{' '}
<span className="text-slate-300">{organisationName}</span>
<span className="ml-2 font-mono text-slate-600">{organisationId}</span>
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-100 md:flex">
              <UserRound size={14} strokeWidth={2} />
              <span>{roleLabel}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}