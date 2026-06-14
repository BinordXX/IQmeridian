'use client';

import { useState } from 'react';

import {
  updateAnalyticsExportGovernanceSetting,
  type InternalAnalyticsExportGovernanceSettingOutput,
} from '../_lib/internal-api';

export function ExportGovernanceSettingsClient({
  initialSetting,
}: {
  initialSetting: InternalAnalyticsExportGovernanceSettingOutput;
}) {
  const [setting, setSetting] = useState(initialSetting);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function handleToggle(nextApprovalRequired: boolean) {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updatedSetting = await updateAnalyticsExportGovernanceSetting({
        approvalRequired: nextApprovalRequired,
      });

      setSetting(updatedSetting);

      setSuccessMessage(
        updatedSetting.approvalRequired
          ? 'Approval requirement enabled. Researcher exports now require admin approval.'
          : 'Approval requirement disabled. Researcher exports will be auto-approved and auto-generated.'
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Export governance setting could not be updated.'
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Export governance setting
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Approval requirement
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Control whether researcher export requests must wait for platform
            admin approval. When approval is disabled, researcher requests are
            automatically approved, generated, audited, and made available for
            researcher download.
          </p>
        </div>

        <span
          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
            setting.approvalRequired
              ? 'bg-amber-100 text-amber-900'
              : 'bg-emerald-100 text-emerald-900'
          }`}
        >
          {setting.approvalRequired
            ? 'Approval required'
            : 'Auto-approval enabled'}
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <button
          type="button"
          disabled={isSaving || setting.approvalRequired}
          onClick={() => void handleToggle(true)}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-4 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="font-semibold text-slate-950">
            Require admin approval
          </span>
          <span className="mt-2 block leading-6 text-slate-600">
            Researcher exports enter the approval queue. Admins approve,
            decline, generate, and then researchers download.
          </span>
        </button>

        <button
          type="button"
          disabled={isSaving || !setting.approvalRequired}
          onClick={() => void handleToggle(false)}
          className="rounded-2xl border border-slate-300 bg-white px-4 py-4 text-left text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="font-semibold text-slate-950">
            Enable auto-approval
          </span>
          <span className="mt-2 block leading-6 text-slate-600">
            Researcher exports are automatically approved and generated. The
            download appears in the researcher export history immediately.
          </span>
        </button>
      </div>

      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <dt className="text-slate-500">Last updated by role</dt>
          <dd className="mt-1 font-semibold text-slate-950">
            {setting.updatedByRole ?? 'System default'}
          </dd>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <dt className="text-slate-500">Updated at</dt>
          <dd className="mt-1 font-semibold text-slate-950">
            {new Date(setting.updatedAt).toLocaleString()}
          </dd>
        </div>
      </dl>

      {errorMessage ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          {successMessage}
        </div>
      ) : null}
    </section>
  );
}
