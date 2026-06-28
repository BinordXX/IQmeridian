'use client';

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  MessageSquareText,
  UserRound,
} from 'lucide-react';
import { FormEvent, useState } from 'react';

type ContactFormStatus = 'idle' | 'submitting' | 'success';

type ContactResponse = {
  id?: string;
  message?: string;
  status?: string;
  submittedAt?: string;
};

const enquiryOptions = [
  {
    label: 'Product enquiry',
    value: 'PRODUCT',
  },
  {
    label: 'Employer partnership',
    value: 'EMPLOYER',
  },
  {
    label: 'Research collaboration',
    value: 'RESEARCH',
  },
  {
    label: 'Governance / privacy',
    value: 'GOVERNANCE',
  },
  {
    label: 'General enquiry',
    value: 'GENERAL',
  },
];

function getReadableContactMessage(payload: ContactResponse | null) {
  return payload?.message ?? 'Contact message failed.';
}

export function ContactForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organisation, setOrganisation] = useState('');
  const [enquiryType, setEnquiryType] = useState('PRODUCT');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<ContactFormStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);

  const isSubmitting = status === 'submitting';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError(null);
    setConfirmationId(null);

    const normalisedFullName = fullName.trim();
    const normalisedEmail = email.trim().toLowerCase();
    const normalisedMessage = message.trim();

    if (!normalisedFullName || !normalisedEmail || !normalisedMessage) {
      setError('Full name, email, and message are required.');
      return;
    }

    if (normalisedMessage.length < 20) {
      setError('Message must be at least 20 characters.');
      return;
    }

    setStatus('submitting');

    try {
      const response = await fetch('/api/contact', {
        body: JSON.stringify({
          email: normalisedEmail,
          enquiryType,
          fullName: normalisedFullName,
          message: normalisedMessage,
          organisation: organisation.trim() || undefined,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      });

      let payload: ContactResponse | null = null;

      try {
        payload = (await response.json()) as ContactResponse;
      } catch {
        payload = null;
      }

      if (!response.ok) {
        setStatus('idle');
        setError(getReadableContactMessage(payload));
        return;
      }

      setStatus('success');
      setConfirmationId(payload?.id ?? null);
      setFullName('');
      setEmail('');
      setOrganisation('');
      setEnquiryType('PRODUCT');
      setMessage('');
    } catch {
      setStatus('idle');
      setError('Unable to send the message. Try again.');
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(3,7,18,0.96))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
      <div
        aria-hidden="true"
        className="absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-cyan-400/10 blur-[90px]"
      />

      <div className="relative">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300">
            Message
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
            Send a structured enquiry.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Your message will be stored for review. A routed notification layer
            can be added later when email delivery is configured.
          </p>
        </div>

        {status === 'success' ? (
          <div className="mt-8 rounded-[1.5rem] border border-emerald-300/20 bg-emerald-400/10 p-5">
            <div className="flex gap-3">
              <CheckCircle2
                className="mt-0.5 shrink-0 text-emerald-300"
                size={20}
              />
              <div>
                <h3 className="text-sm font-black text-emerald-100">
                  Message received.
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Your enquiry has been submitted successfully.
                  {confirmationId ? (
                    <>
                      {' '}
                      Reference:{' '}
                      <span className="font-mono text-cyan-200">
                        {confirmationId}
                      </span>
                    </>
                  ) : null}
                </p>
                <button
                  className="mt-4 text-sm font-black text-cyan-300 transition hover:text-cyan-200"
                  onClick={() => setStatus('idle')}
                  type="button"
                >
                  Send another message
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-8 grid gap-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-300">
                  Full name
                </span>
                <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-cyan-300/50">
                  <UserRound
                    className="text-slate-500"
                    size={18}
                    strokeWidth={2.2}
                  />
                  <input
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your name"
                    type="text"
                    value={fullName}
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-300">
                  Email
                </span>
                <span className="mt-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-cyan-300/50">
                  <Mail
                    className="text-slate-500"
                    size={18}
                    strokeWidth={2.2}
                  />
                  <input
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={email}
                  />
                </span>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Organisation
              </span>
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onChange={(event) => setOrganisation(event.target.value)}
                placeholder="Optional"
                type="text"
                value={organisation}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Enquiry type
              </span>
              <select
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#07142f] px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                onChange={(event) => setEnquiryType(event.target.value)}
                value={enquiryType}
              >
                {enquiryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Message
              </span>
              <span className="mt-2 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition focus-within:border-cyan-300/50">
                <MessageSquareText
                  className="mt-1 text-slate-500"
                  size={18}
                  strokeWidth={2.2}
                />
                <textarea
                  className="min-h-36 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tell us what you want to discuss."
                  value={message}
                />
              </span>
              <span className="mt-2 block text-xs text-slate-500">
                Minimum 20 characters.
              </span>
            </label>

            <div aria-live="polite">
              {error ? (
                <div className="flex gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">
                  <AlertCircle className="mt-0.5 shrink-0" size={17} />
                  <span>{error}</span>
                </div>
              ) : null}

              {isSubmitting ? (
                <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-cyan-100">
                  Sending your enquiry to IQMeridian.
                </div>
              ) : null}
            </div>

            <button
              className="inline-flex w-fit items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-6 py-3 text-sm font-black text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.14),0_12px_40px_rgba(34,211,238,0.18)] transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={17} />
                  Sending message
                </>
              ) : (
                <>
                  Send message
                  <ArrowRight size={17} strokeWidth={2.4} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}