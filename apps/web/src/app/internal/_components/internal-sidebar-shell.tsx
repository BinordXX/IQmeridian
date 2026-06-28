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
  ScrollText,
  Settings2,
  ShieldCheck,
  UserRound,
  Users,
   Mail,
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
    base: 'border-blue-100 bg-blue-50 text-blue-700',
    active: 'border-blue-200 bg-blue-100 text-blue-800',
    badge: 'bg-blue-50 text-blue-700',
    iconText: 'text-blue-600',
  },
  violet: {
    base: 'border-violet-100 bg-violet-50 text-violet-700',
    active: 'border-violet-200 bg-violet-100 text-violet-800',
    badge: 'bg-violet-50 text-violet-700',
    iconText: 'text-violet-600',
  },
  amber: {
    base: 'border-amber-100 bg-amber-50 text-amber-700',
    active: 'border-amber-200 bg-amber-100 text-amber-800',
    badge: 'bg-amber-50 text-amber-700',
    iconText: 'text-amber-600',
  },
  emerald: {
    base: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    active: 'border-emerald-200 bg-emerald-100 text-emerald-800',
    badge: 'bg-emerald-50 text-emerald-700',
    iconText: 'text-emerald-600',
  },
  indigo: {
    base: 'border-indigo-100 bg-indigo-50 text-indigo-700',
    active: 'border-indigo-200 bg-indigo-100 text-indigo-800',
    badge: 'bg-indigo-50 text-indigo-700',
    iconText: 'text-indigo-600',
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
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 px-6 py-6">
            <Link href="/internal" className="block">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-500">
                IQMeridian
              </p>
              <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                Internal console
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
                  {role.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4">
            <div className="space-y-1">
              {navGroups.map((group) => {
                const GroupIcon = group.icon;
                const hasActiveItem = group.items.some((item) =>
                  isActivePath(pathname, item)
                );

                return (
                  <div className="group relative" key={group.label}>
                    <button
                      className={[
                        'flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition',
                        hasActiveItem
                          ? 'bg-slate-100 text-slate-950'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950',
                      ].join(' ')}
                      type="button"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span
                          className={[
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                            hasActiveItem ? group.tone.active : group.tone.base,
                          ].join(' ')}
                        >
                          <GroupIcon size={18} strokeWidth={2} />
                        </span>

                        <span className="min-w-0">
                          <span className="block text-sm font-semibold">
                            {group.label}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">
                            {group.description}
                          </span>
                        </span>
                      </span>

                      <ChevronRight
                        className="shrink-0 text-slate-400"
                        size={17}
                        strokeWidth={2}
                      />
                    </button>

                    <div className="invisible absolute left-full top-0 z-50 ml-3 min-w-80 rounded-2xl border border-slate-200 bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                      <div className="border-b border-slate-100 px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className={[
                              'flex h-9 w-9 items-center justify-center rounded-lg',
                              group.tone.badge,
                            ].join(' ')}
                          >
                            <GroupIcon size={18} strokeWidth={2} />
                          </span>

                          <span>
                            <p className="text-sm font-bold text-slate-950">
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
                                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                                isActive
                                  ? 'bg-slate-950 text-white'
                                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
                              ].join(' ')}
                              href={item.href}
                              key={item.href}
                            >
                              <ItemIcon
                                className={
                                  isActive ? 'text-white' : group.tone.iconText
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
                Researcher and platform administration
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Secure internal workspace for IQMeridian operations.
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 md:flex">
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
