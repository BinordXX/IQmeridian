'use client';

import { useState, type FormEvent } from 'react';

type OrganisationAccessRequestFormState = {
  organisationName: string;
  website: string;
  industry: string;
  country: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  intendedUse: string;
  expectedVolume: string;
};

type SubmittedRequest = {
  id: string;
  organisationName: string;
  contactEmail: string;
  status: string;
  createdAt: string;
};

const initialFormState: OrganisationAccessRequestFormState = {
  organisationName: '',
  website: '',
  industry: '',
  country: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  intendedUse: '',
  expectedVolume: '',
};

const normaliseOptionalValue = (value: string) => {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : undefined;
};

const getErrorMessage = (payload: {
  message?: string | string[];
  error?: string;
}) => {
  if (Array.isArray(payload.message)) {
    return payload.message.join(' ');
  }

  return payload.message ?? payload.error ?? 'The request could not be submitted.';
};

export function OrganisationAccessRequestForm() {
  const [formState, setFormState] =
    useState<OrganisationAccessRequestFormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRequest, setSubmittedRequest] =
    useState<SubmittedRequest | null>(null);

  const updateField = (
    field: keyof OrganisationAccessRequestFormState,
    value: string,
  ) => {
    setFormState((currentState) => ({
      ...currentState,
      [field]: value,
    }));
  };

  const submitRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (formState.organisationName.trim().length < 2) {
      setErrorMessage('Enter the organisation name.');
      return;
    }

    if (formState.contactName.trim().length < 2) {
      setErrorMessage('Enter the contact person name.');
      return;
    }

    if (!formState.contactEmail.trim().includes('@')) {
      setErrorMessage('Enter a valid contact email address.');
      return;
    }

    if (formState.intendedUse.trim().length < 20) {
      setErrorMessage(
        'Explain the intended use in at least 20 characters.',
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSubmittedRequest(null);

    try {
      const response = await fetch('/api/organisation-access-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organisationName: formState.organisationName.trim(),
          website: normaliseOptionalValue(formState.website),
          industry: normaliseOptionalValue(formState.industry),
          country: normaliseOptionalValue(formState.country),
          contactName: formState.contactName.trim(),
          contactEmail: formState.contactEmail.trim().toLowerCase(),
          contactPhone: normaliseOptionalValue(formState.contactPhone),
          intendedUse: formState.intendedUse.trim(),
          expectedVolume: normaliseOptionalValue(formState.expectedVolume),
        }),
      });

const payload = (await response.json().catch(() => ({}))) as Partial<
  SubmittedRequest & {
    message: string | string[];
    error: string;
  }
>;

if (!response.ok) {
  throw new Error(getErrorMessage(payload));
}

setSubmittedRequest(payload as SubmittedRequest);
      setFormState(initialFormState);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'The request could not be submitted.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedRequest) {
    return (
      <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
          Request submitted
        </p>

        <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
          Your organisation access request is pending review.
        </h2>

        <p className="mt-4 max-w-3xl text-sm leading-6 text-emerald-100/80">
          IQMeridian will review the organisation details before granting access
          to employer assessment controls.
        </p>

        <dl className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <dt className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
              Organisation
            </dt>
            <dd className="mt-2 text-sm font-black text-white">
              {submittedRequest.organisationName}
            </dd>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <dt className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
              Status
            </dt>
            <dd className="mt-2 text-sm font-black text-white">
              {submittedRequest.status}
            </dd>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 md:col-span-2">
            <dt className="text-xs font-black uppercase tracking-[0.18em] text-emerald-200">
              Request ID
            </dt>
            <dd className="mt-2 break-all font-mono text-xs text-emerald-100/80">
              {submittedRequest.id}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={() => setSubmittedRequest(null)}
          className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/15"
        >
          Submit another request
        </button>
      </section>
    );
  }

  return (
    <form
      onSubmit={submitRequest}
      className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#07142f]/88 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.14),transparent_30%)]"
      />

      <div className="relative space-y-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Organisation access
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
            Request employer access
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Submit your organisation details for review. Approved organisations
            will receive controlled employer access to campaign and assessment
            tools.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="organisation-name"
              className="text-sm font-black text-slate-300"
            >
              Organisation name
            </label>
            <input
              id="organisation-name"
              value={formState.organisationName}
              onChange={(event) =>
                updateField('organisationName', event.currentTarget.value)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              placeholder="Acme Talent Limited"
              required
            />
          </div>

          <div>
            <label
              htmlFor="website"
              className="text-sm font-black text-slate-300"
            >
              Website
            </label>
            <input
              id="website"
              value={formState.website}
              onChange={(event) =>
                updateField('website', event.currentTarget.value)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label
              htmlFor="industry"
              className="text-sm font-black text-slate-300"
            >
              Industry
            </label>
            <input
              id="industry"
              value={formState.industry}
              onChange={(event) =>
                updateField('industry', event.currentTarget.value)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              placeholder="Technology, consulting, education"
            />
          </div>

          <div>
            <label
              htmlFor="country"
              className="text-sm font-black text-slate-300"
            >
              Country
            </label>
            <input
              id="country"
              value={formState.country}
              onChange={(event) =>
                updateField('country', event.currentTarget.value)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              placeholder="United Kingdom, Nigeria, United States"
            />
          </div>

          <div>
            <label
              htmlFor="contact-name"
              className="text-sm font-black text-slate-300"
            >
              Contact person
            </label>
            <input
              id="contact-name"
              value={formState.contactName}
              onChange={(event) =>
                updateField('contactName', event.currentTarget.value)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              placeholder="Jane Smith"
              required
            />
          </div>

          <div>
            <label
              htmlFor="contact-email"
              className="text-sm font-black text-slate-300"
            >
              Contact email
            </label>
            <input
              id="contact-email"
              type="email"
              value={formState.contactEmail}
              onChange={(event) =>
                updateField('contactEmail', event.currentTarget.value)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              placeholder="jane@example.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="contact-phone"
              className="text-sm font-black text-slate-300"
            >
              Contact phone
            </label>
            <input
              id="contact-phone"
              value={formState.contactPhone}
              onChange={(event) =>
                updateField('contactPhone', event.currentTarget.value)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              placeholder="+44..."
            />
          </div>

          <div>
            <label
              htmlFor="expected-volume"
              className="text-sm font-black text-slate-300"
            >
              Expected assessment volume
            </label>
            <input
              id="expected-volume"
              value={formState.expectedVolume}
              onChange={(event) =>
                updateField('expectedVolume', event.currentTarget.value)
              }
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
              placeholder="20 candidates per month"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="intended-use"
            className="text-sm font-black text-slate-300"
          >
            Intended use
          </label>
          <textarea
            id="intended-use"
            value={formState.intendedUse}
            onChange={(event) =>
              updateField('intendedUse', event.currentTarget.value)
            }
            className="mt-2 min-h-36 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/40"
            placeholder="Explain how your organisation intends to use IQMeridian assessments."
            required
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Include hiring context, candidate population, assessment use case,
            and any governance concerns.
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-300/20 bg-red-400/10 p-4 text-sm font-bold leading-6 text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-600"
          >
            {isSubmitting ? 'Submitting request...' : 'Submit access request'}
          </button>

          <p className="text-xs leading-5 text-slate-500">
            Submission does not grant immediate employer dashboard access.
          </p>
        </div>
      </div>
    </form>
  );
}