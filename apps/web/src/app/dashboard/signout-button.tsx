import Link from 'next/link';

export function SignOutButton() {
  return (
    <Link
      href="/logout"
      className="inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
    >
      Sign out
    </Link>
  );
}
