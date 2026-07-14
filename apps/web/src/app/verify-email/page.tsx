import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { EmailVerificationPanel } from './email-verification-panel';

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    token?: string;
    email?: string;
  }>;
};

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const resolvedSearchParams = await searchParams;
  const token = resolvedSearchParams?.token ?? '';
  const email = resolvedSearchParams?.email ?? '';

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020817] px-6 py-10 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_92%_8%,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.94),rgba(2,8,23,1))]"
      />

      <div className="relative mx-auto max-w-4xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 transition hover:text-cyan-200"
            href="/"
          >
            <ArrowLeft size={16} strokeWidth={2.3} />
            Back to IQMeridian
          </Link>

          <Link
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-black text-slate-200 transition hover:bg-white/[0.07]"
            href="/login"
          >
            Sign in
          </Link>
        </header>

        <EmailVerificationPanel initialEmail={email} token={token} />
      </div>
    </main>
  );
}
