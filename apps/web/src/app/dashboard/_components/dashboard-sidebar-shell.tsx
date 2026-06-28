'use client';

import {
  ClipboardCheck,
  FileText,
  Home,
  LogOut,
  LucideIcon,
  Settings,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type DashboardRole = 'CONSUMER' | 'CANDIDATE';

type DashboardSidebarShellProps = {
  children: ReactNode;
  role: DashboardRole;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
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
    description: 'Current profile',
    href: '/dashboard',
    exact: true,
    icon: Home,
    tone: 'border-blue-100 bg-blue-50 text-blue-700',
  },
  {
    label: 'Assessment',
    description: 'Start or resume',
    href: '/dashboard#assessment',
    icon: ClipboardCheck,
    tone: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  },
  {
    label: 'Results',
    description: 'Completed assessments',
    href: '/dashboard#history',
    icon: FileText,
    tone: 'border-violet-100 bg-violet-50 text-violet-700',
  },
    {
    label: 'Settings',
    description: 'Account security',
    href: '/dashboard/settings',
    icon: Settings,
    tone: 'border-slate-200 bg-slate-50 text-slate-700',
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
  if (item.href.includes('#')) {
    return pathname === item.href.split('#')[0];
  }

  if (item.exact) {
    return pathname === item.href;
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
};

export function DashboardSidebarShell({
  children,
  role,
  user,
}: DashboardSidebarShellProps) {
  const pathname = usePathname();
  const initials = getInitials(user.name, user.email);
  const displayName = user.name || user.email || 'Dashboard user';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-6 py-6">
            <Link href="/dashboard" className="block">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">
                IQMeridian
              </p>
              <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                Assessment workspace
              </h1>
            </Link>
          </div>

          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 bg-cover bg-center text-sm font-bold text-slate-800"
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
                <p className="truncate text-sm font-semibold text-slate-950">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {user.email}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {role}
                </p>
              </div>
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
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition',
                      isActive
                        ? 'bg-slate-100 text-slate-950'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950',
                    ].join(' ')}
                    href={item.href}
                    key={item.href}
                  >
                    <span
                      className={[
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                        item.tone,
                      ].join(' ')}
                    >
                      <Icon size={18} strokeWidth={2} />
                    </span>

                    <span className="min-w-0">
                      <span className="block font-semibold">{item.label}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-slate-200 p-4">
            <Link
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-950 hover:text-slate-950"
              href="/logout"
            >
              <LogOut size={17} strokeWidth={2} />
              <span>Sign out</span>
            </Link>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  Assessment workspace
</p>
              <p className="mt-1 text-sm text-slate-600">
                Manage your IQMeridian assessment activity and results.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 md:flex">
              <UserRound size={14} strokeWidth={2} />
              <span>{role}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>

        <footer className="mx-auto max-w-7xl px-6 pb-8">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
            <ShieldCheck size={16} strokeWidth={2} />
            <span>
              Your assessment workspace is protected by IQMeridian access
              controls.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
