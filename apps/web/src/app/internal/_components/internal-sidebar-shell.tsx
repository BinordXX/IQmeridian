'use client';

import {
  BarChart3,
  Building2,
  ChevronRight,
  ClipboardList,
  Database,
  FileSearch,
  FileText,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Mail,
  ScrollText,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useMemo } from 'react';

type InternalRole = 'PLATFORM_ADMIN' | 'RESEARCHER';

type InternalSidebarShellProps = {
  children: ReactNode;
  role: InternalRole;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

type NavItem = {
  label: string;
  href: string;
  exact?: boolean;
  icon: LucideIcon;
};

type IconTone = {
  base: string;
  active: string;
  badge: string;
  iconText: string;
};

type NavGroup = {
  label: string;
  description: string;
  icon: LucideIcon;
  tone: IconTone;
  items: NavItem[];
};

const iconTones = {
  blue: {
    base: 'border-cyan-300/15 bg-cyan-400/10 text-cyan-100',
    active:
      'border-cyan-300/30 bg-cyan-400/15 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.14)]',
    badge: 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100',
    iconText: 'text-cyan-300',
  },
  violet: {
    base: 'border-violet-300/15 bg-violet-400/10 text-violet-100',
    active:
      'border-violet-300/30 bg-violet-400/15 text-violet-100 shadow-[0_0_24px_rgba(167,139,250,0.14)]',
    badge: 'border-violet-300/20 bg-violet-400/10 text-violet-100',
    iconText: 'text-violet-300',
  },
  amber: {
    base: 'border-amber-300/15 bg-amber-400/10 text-amber-100',
    active:
      'border-amber-300/30 bg-amber-400/15 text-amber-100 shadow-[0_0_24px_rgba(251,191,36,0.12)]',
    badge: 'border-amber-300/20 bg-amber-400/10 text-amber-100',
    iconText: 'text-amber-300',
  },
  emerald: {
    base: 'border-emerald-300/15 bg-emerald-400/10 text-emerald-100',
    active:
      'border-emerald-300/30 bg-emerald-400/15 text-emerald-100 shadow-[0_0_24px_rgba(52,211,153,0.12)]',
    badge: 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100',
    iconText: 'text-emerald-300',
  },
  indigo: {
    base: 'border-blue-300/15 bg-blue-400/10 text-blue-100',
    active:
      'border-blue-300/30 bg-blue-400/15 text-blue-100 shadow-[0_0_24px_rgba(96,165,250,0.13)]',
    badge: 'border-blue-300/20 bg-blue-400/10 text-blue-100',
    iconText: 'text-blue-300',
  },
} satisfies Record<string, IconTone>;

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

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
};

const buildNavGroups = (role: InternalRole): NavGroup[] => {
  const isPlatformAdmin = role === 'PLATFORM_ADMIN';

  return [
    {
      label: 'Workspace',
      description: 'Internal home and overview',
      icon: LayoutDashboard,
      tone: iconTones.blue,
      items: [
        {
          label: 'Overview',
          href: '/internal',
          exact: true,
          icon: LayoutDashboard,
        },
      ],
    },
    ...(isPlatformAdmin
      ? [
          {
            label: 'Platform admin',
            description: 'Users, organisations, access',
            icon: ShieldCheck,
            tone: iconTones.violet,
            items: [
              {
                label: 'Admin overview',
                href: '/internal/admin',
                exact: true,
                icon: BarChart3,
              },
              {
                label: 'Users',
                href: '/internal/admin/users',
                icon: Users,
              },
              {
                label: 'Organisations',
                href: '/internal/admin/organisations',
                icon: Building2,
              },
              {
                label: 'Inbox',
                href: '/internal/admin/contact-messages',
                icon: Mail,
              },
              {
  label: 'Access requests',
  href: '/internal/admin/organisation-access-requests',
  icon: Building2,
},
              {
                label: 'Consumer assessment',
                href: '/internal/admin/consumer-assessment',
                icon: ClipboardList,
              },
            ],
          },
          {
            label: 'Assessment operations',
            description: 'Sessions, flags, reports',
            icon: FileSearch,
            tone: iconTones.amber,
            items: [
              {
                label: 'Sessions',
                href: '/internal/admin/sessions',
                exact: true,
                icon: ClipboardList,
              },
              {
                label: 'Suspicious sessions',
                href: '/internal/admin/sessions/suspicious',
                icon: ShieldCheck,
              },
              {
                label: 'Reports',
                href: '/internal/admin/reports',
                icon: FileText,
              },
            ],
          },
        ]
      : []),
    {
      label: 'Research',
      description: 'Items, pilot forms, research tools',
      icon: FlaskConical,
      tone: iconTones.emerald,
      items: [
        {
          label: 'Researcher dashboard',
          href: '/internal/researcher',
          exact: true,
          icon: BarChart3,
        },
        {
          label: 'Item bank',
          href: '/internal/researcher/item-bank',
          icon: Database,
        },
        {
          label: 'Pilot forms',
          href: '/internal/researcher/pilot-forms',
          icon: ScrollText,
        },
      ],
    },
    {
      label: 'Data governance',
      description: 'Exports and approval workflows',
      icon: Settings2,
      tone: iconTones.indigo,
      items: [
        ...(isPlatformAdmin
          ? [
              {
                label: 'Export governance',
                href: '/internal/admin/exports',
                icon: Settings2,
              },
            ]
          : []),
        {
          label: 'Export requests',
          href: '/internal/researcher/exports',
          icon: FileText,
        },
      ],
    },
  ];
};

export function InternalSidebarShell({
  children,
  role,
  user,
}: InternalSidebarShellProps) {
  const pathname = usePathname();
  const navGroups = useMemo(() => buildNavGroups(role), [role]);

  const initials = getInitials(user.name, user.email);
  const displayName = user.name || user.email || 'Internal user';

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#020817] text-white selection:bg-cyan-400/30 selection:text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.13),transparent_24%),radial-gradient(circle_at_85%_12%,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_50%_80%,rgba(168,85,247,0.1),transparent_26%)]" />
        <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-[-10rem] top-24 h-[28rem] w-[28rem] rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="absolute right-[-8rem] top-[28rem] h-[24rem] w-[24rem] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-fuchsia-500/10 blur-[120px]" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 overflow-visible border-r border-white/10 bg-[#050b21]/88 shadow-[20px_0_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <Link href="/internal" className="block">
              <p className="text-xs font-black uppercase tracking-[0.34em] text-cyan-300">
                IQMeridian
              </p>
              <h1 className="mt-2 text-xl font-black tracking-tight text-white">
                Internal console
              </h1>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Platform operations and research control.
              </p>
            </Link>
          </div>

          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 bg-cover bg-center text-sm font-black text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,0.12)]"
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
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {user.email}
                </p>
                <p className="mt-1 text-xs font-black uppercase tracking-wide text-cyan-300">
                  {role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-visible px-3 py-4">
            <div className="space-y-1.5">
              {navGroups.map((group) => {
                const GroupIcon = group.icon;
                const hasActiveItem = group.items.some((item) =>
                  isActivePath(pathname, item),
                );

                return (
                  <div className="group relative" key={group.label}>
                    <button
                      className={[
                        'flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition',
                        hasActiveItem
                          ? 'border-cyan-300/18 bg-cyan-400/10 text-white shadow-[0_16px_45px_rgba(34,211,238,0.08)]'
                          : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.045] hover:text-white',
                      ].join(' ')}
                      type="button"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={[
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border',
                            hasActiveItem ? group.tone.active : group.tone.base,
                          ].join(' ')}
                        >
                          <GroupIcon size={18} strokeWidth={2} />
                        </span>

                        <span className="min-w-0">
                          <span className="block text-sm font-black">
                            {group.label}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">
                            {group.description}
                          </span>
                        </span>
                      </span>

                      <ChevronRight
                        className={[
                          'shrink-0 transition',
                          hasActiveItem ? 'text-cyan-300' : 'text-slate-600',
                        ].join(' ')}
                        size={17}
                        strokeWidth={2}
                      />
                    </button>

                    <div className="pointer-events-none invisible absolute left-[calc(100%+0.75rem)] top-0 z-[80] min-w-80 rounded-[1.5rem] border border-cyan-300/15 bg-[#07142f]/96 p-2 opacity-0 shadow-[0_30px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl transition group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100">
                      <div className="border-b border-white/10 px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={[
                              'flex h-9 w-9 items-center justify-center rounded-xl border',
                              group.tone.badge,
                            ].join(' ')}
                          >
                            <GroupIcon size={18} strokeWidth={2} />
                          </span>

                          <span>
                            <p className="text-sm font-black text-white">
                              {group.label}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {group.description}
                            </p>
                          </span>
                        </div>
                      </div>

                      <div className="py-2">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const isActive = isActivePath(pathname, item);

                          return (
                            <Link
                              className={[
                                'flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-bold transition',
                                isActive
                                  ? 'border-cyan-300/20 bg-cyan-400/12 text-cyan-100'
                                  : 'border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-white',
                              ].join(' ')}
                              href={item.href}
                              key={item.href}
                            >
                              <ItemIcon
                                className={
                                  isActive ? 'text-cyan-200' : group.tone.iconText
                                }
                                size={17}
                                strokeWidth={2}
                              />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-white/10 p-4">
            <Link
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-black text-slate-300 transition hover:border-cyan-300/25 hover:bg-cyan-400/10 hover:text-cyan-100"
              href="/logout"
            >
              <LogOut size={17} strokeWidth={2} />
              <span>Sign out</span>
            </Link>
          </div>
        </div>
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050b21]/78 px-6 py-4 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Researcher and platform administration
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Secure internal workspace for IQMeridian operations.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-cyan-100 md:flex">
              <UserRound size={14} strokeWidth={2} />
              <span>{role.replace('_', ' ')}</span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}