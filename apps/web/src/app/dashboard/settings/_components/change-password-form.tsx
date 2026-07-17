'use client';

import { FormEvent, useState } from 'react';

type ChangePasswordResponse = {
  status?: string;
  message?: string;
};

const initialFormState = {
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
};

export function ChangePasswordForm() {
  const [formState, setFormState] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateField = (field: keyof typeof initialFormState, value: string) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setSuccessMessage(null);
    setErrorMessage(null);

    if (formState.newPassword !== formState.confirmNewPassword) {
      setErrorMessage('New password confirmation does not match.');
      return;
    }

    if (formState.newPassword.length < 12) {
      setErrorMessage('New password must be at least 12 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      const responseText = await response.text();
      const payload = responseText.trim()
        ? (JSON.parse(responseText) as ChangePasswordResponse)
        : null;

      if (!response.ok) {
        setErrorMessage(payload?.message ?? 'Password could not be changed.');
        return;
      }

      setSuccessMessage(payload?.message ?? 'Password changed successfully.');
      setFormState(initialFormState);
    } catch {
      setErrorMessage('Password could not be changed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          className="text-sm font-black text-cyan-100"
          htmlFor="currentPassword"
        >
          Current password
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/15 bg-[#020817] px-4 py-3 text-base font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 sm:text-sm"
          id="currentPassword"
          name="currentPassword"
          onChange={(event) =>
            updateField('currentPassword', event.target.value)
          }
          required
          type="password"
          value={formState.currentPassword}
        />
      </div>

      <div>
        <label
          className="text-sm font-black text-cyan-100"
          htmlFor="newPassword"
        >
          New password
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/15 bg-[#020817] px-4 py-3 text-base font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 sm:text-sm"
          id="newPassword"
          minLength={12}
          name="newPassword"
          onChange={(event) => updateField('newPassword', event.target.value)}
          required
          type="password"
          value={formState.newPassword}
        />
        <p className="mt-2 text-xs text-slate-500">
          Use at least 12 characters.
        </p>
      </div>

      <div>
        <label
          className="text-sm font-black text-cyan-100"
          htmlFor="confirmNewPassword"
        >
          Confirm new password
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 min-h-12 w-full rounded-2xl border border-cyan-300/15 bg-[#020817] px-4 py-3 text-base font-bold text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 sm:text-sm"
          id="confirmNewPassword"
          minLength={12}
          name="confirmNewPassword"
          onChange={(event) =>
            updateField('confirmNewPassword', event.target.value)
          }
          required
          type="password"
          value={formState.confirmNewPassword}
        />
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}

      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-500 sm:w-auto"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Changing password...' : 'Change password'}
      </button>
    </form>
  );
}
