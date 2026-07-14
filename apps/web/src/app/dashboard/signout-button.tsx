import Link from 'next/link';

export function SignOutButton() {
  return (
    <Link
      href="/logout"
      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15"
    >
      Sign out
    </Link>
  );
}
