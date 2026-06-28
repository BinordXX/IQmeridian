import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import {
  Bell,
  Database,
  KeyRound,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { ChangePasswordForm } from './_components/change-password-form';

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export default async function DashboardSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/settings');
  }

  const user = session.user;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
          Settings
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Account settings
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Manage your IQMeridian account profile, password, session security,
          and future notification and data controls.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1.25fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
              <UserRound size={20} strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Account summary
              </h2>
              <p className="text-sm text-slate-500">
                Your current signed-in profile.
              </p>
            </div>
          </div>

          <dl className="mt-6 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-500">Name</dt>
              <dd className="mt-1 text-slate-950">
                {user.name ?? 'Not provided'}
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-slate-500">Email</dt>
              <dd className="mt-1 text-slate-950">
                {user.email ?? 'Not available'}
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-slate-500">Role</dt>
              <dd className="mt-1 text-slate-950">
                {(session as { role?: string | null }).role ?? 'Not available'}
              </dd>
            </div>

            <div>
              <dt className="font-semibold text-slate-500">
                Session expires
              </dt>
              <dd className="mt-1 text-slate-950">
                {formatDate(session.expires)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-700">
              <KeyRound size={20} strokeWidth={2} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Change password
              </h2>
              <p className="text-sm text-slate-500">
                Update your local IQMeridian sign-in password.
              </p>
            </div>
          </div>

          <ChangePasswordForm />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <Bell className="text-slate-500" size={22} strokeWidth={2} />
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            Notifications
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Notification preferences will be added here when email and product
            messaging workflows are enabled.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <Database className="text-slate-500" size={22} strokeWidth={2} />
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            Data and privacy
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Export, deletion, and consent controls will be added after the
            account data-governance workflow is finalised.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <ShieldCheck className="text-slate-500" size={22} strokeWidth={2} />
          <h2 className="mt-4 text-lg font-bold text-slate-950">
            Security activity
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Login history and active-session management will be added after the
            audit activity viewer is exposed to users.
          </p>
        </section>
      </div>
    </div>
  );
}