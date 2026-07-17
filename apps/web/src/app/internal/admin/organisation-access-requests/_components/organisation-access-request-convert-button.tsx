'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type OrganisationAccessRequestConvertButtonProps = {
  requestId: string;
  status: string;
  convertedOrganisationId: string | null;
};

const getErrorMessage = (payload: {
  message?: string | string[];
  error?: string;
}) => {
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ');
  }

  return (
    payload.message ?? payload.error ?? 'The request could not be converted.'
  );
};

export function OrganisationAccessRequestConvertButton({
  requestId,
  status,
  convertedOrganisationId,
}: OrganisationAccessRequestConvertButtonProps) {
  const router = useRouter();
  const [isConverting, setIsConverting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const canConvert = status === 'APPROVED' && !convertedOrganisationId;

  const convertRequest = async () => {
    if (!canConvert || isConverting) {
      return;
    }

    const confirmed = window.confirm(
      'Convert this approved request into an organisation and create an employer-admin invitation?'
    );

    if (!confirmed) {
      return;
    }

    setIsConverting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(
        `/api/internal/organisation-access-requests/${encodeURIComponent(
          requestId
        )}/convert`,
        {
          method: 'POST',
        }
      );

      const payload = (await response.json().catch(() => ({}))) as {
        message?: string | string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(getErrorMessage(payload));
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The request could not be converted.'
      );
    } finally {
      setIsConverting(false);
    }
  };

  if (convertedOrganisationId) {
    return (
      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm font-bold leading-6 text-emerald-100">
        This request has already been converted into an organisation.
      </div>
    );
  }

  if (status !== 'APPROVED') {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-slate-400">
        Conversion is available only after the request is approved.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
        Provision organisation
      </p>

      <p className="mt-2 text-sm leading-6 text-cyan-100/80">
        Create the organisation record and generate an employer-admin invitation
        for the submitted contact email.
      </p>

      <button
        className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
        disabled={!canConvert || isConverting}
        onClick={convertRequest}
        type="button"
      >
        {isConverting ? 'Converting...' : 'Convert to organisation'}
      </button>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
