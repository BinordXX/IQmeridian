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

  const updateField = (
    field: keyof typeof initialFormState,
    value: string
  ) => {
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
        setErrorMessage(
          payload?.message ?? 'Password could not be changed.'
        );
        return;
      }

      setSuccessMessage(
        payload?.message ?? 'Password changed successfully.'
      );
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
          className="text-sm font-semibold text-slate-700"
          htmlFor="currentPassword"
        >
          Current password
        </label>
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-950"
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
          className="text-sm font-semibold text-slate-700"
          htmlFor="newPassword"
        >
          New password
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-950"
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
          className="text-sm font-semibold text-slate-700"
          htmlFor="confirmNewPassword"
        >
          Confirm new password
        </label>
        <input
          autoComplete="new-password"
          className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-slate-950"
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
        className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Changing password...' : 'Change password'}
      </button>
    </form>
  );
}