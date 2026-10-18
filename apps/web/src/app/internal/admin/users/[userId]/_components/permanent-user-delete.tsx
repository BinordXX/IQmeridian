'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type PermanentUserDeleteProps = {
  userId: string;
  email: string;
  name?: string | null;
  status: string;
};

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return 'The user could not be permanently deleted.';
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.message === 'string') {
    return record.message;
  }

  if (Array.isArray(record.message)) {
    return record.message
      .filter((entry): entry is string => typeof entry === 'string')
      .join(' ');
  }

  return 'The user could not be permanently deleted.';
}

export function PermanentUserDelete({
  userId,
  email,
  name,
  status,
}: PermanentUserDeleteProps) {
  const router = useRouter();

  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmationMatches =
    confirmation.trim().toLowerCase() === email.trim().toLowerCase();

  const permanentlyDelete = async () => {
    if (!confirmationMatches || isDeleting) {
      return;
    }

    const confirmed = window.confirm(
      `Permanently purge ${name ?? email}? The account and its associated user history will be deleted. This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/internal/admin/users/${encodeURIComponent(userId)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            confirmationEmail: confirmation.trim().toLowerCase(),
          }),
        }
      );

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      router.push('/internal/admin/users');
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'The user could not be permanently deleted.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-red-400/20 bg-red-500/[0.055] p-6">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-red-300">
        Danger zone
      </p>

      <h2 className="mt-3 text-xl font-black text-white">
        Permanent account purge
      </h2>

      <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
        This action permanently removes the user account and associated
        account-owned history from IQMeridian. It cannot be undone.
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
        <p className="text-slate-400">
          Account:{' '}
          <span className="font-bold text-slate-200">{name ?? email}</span>
        </p>

        <p className="mt-1 text-slate-400">
          Email: <span className="font-bold text-slate-200">{email}</span>
        </p>

        <p className="mt-1 text-slate-400">
          Current status:{' '}
          <span className="font-bold text-slate-200">{status}</span>
        </p>
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-bold text-slate-300">
          Type the user&apos;s email to confirm permanent deletion
        </span>

        <input
          type="email"
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          disabled={isDeleting}
          placeholder={email}
          className="mt-2 w-full rounded-2xl border border-red-400/20 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-300/50 focus:ring-2 focus:ring-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-200">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => void permanentlyDelete()}
        disabled={!confirmationMatches || isDeleting}
        className="mt-5 inline-flex items-center justify-center rounded-full border border-red-300/30 bg-red-500/15 px-5 py-3 text-sm font-black text-red-100 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isDeleting ? 'Permanently purging...' : 'Permanently purge user'}
      </button>
    </section>
  );
}
