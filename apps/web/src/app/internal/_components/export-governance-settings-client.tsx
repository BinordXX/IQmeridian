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
    <section className="rounded-[2rem] border border-white/10 bg-[#07142f]/90 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.24)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
            Export governance setting
          </p>

          <h2 className="mt-3 text-xl font-black text-white">
            Approval requirement
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
            Control whether researcher export requests must wait for platform
            admin approval. When approval is disabled, researcher requests are
            automatically approved, generated, audited, and made available for
            researcher download.
          </p>
        </div>

        <span
          className={`w-fit rounded-full border px-3 py-1 text-xs font-black ${
            setting.approvalRequired
              ? 'border-amber-300/20 bg-amber-400/10 text-amber-100'
              : 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
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
          className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-4 text-left text-sm transition hover:border-cyan-300/20 hover:bg-[#0b1d3f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="font-black text-white">Require admin approval</span>

          <span className="mt-2 block leading-7 text-slate-400">
            Researcher exports enter the approval queue. Admins approve,
            decline, generate, and then researchers download.
          </span>
        </button>

        <button
          type="button"
          disabled={isSaving || !setting.approvalRequired}
          onClick={() => void handleToggle(false)}
          className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-4 text-left text-sm transition hover:border-cyan-300/20 hover:bg-[#0b1d3f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="font-black text-white">Enable auto-approval</span>

          <span className="mt-2 block leading-7 text-slate-400">
            Researcher exports are automatically approved and generated. The
            download appears in the researcher export history immediately.
          </span>
        </button>
      </div>

      <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
          <dt className="text-slate-500">Last updated by role</dt>
          <dd className="mt-1 font-black text-white">
            {setting.updatedByRole ?? 'System default'}
          </dd>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#020817]/70 px-4 py-3">
          <dt className="text-slate-500">Updated at</dt>
          <dd className="mt-1 font-black text-white">
            {new Date(setting.updatedAt).toLocaleString()}
          </dd>
        </div>
      </dl>

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm font-bold leading-7 text-red-100">
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold leading-7 text-emerald-100">
          {successMessage}
        </div>
      ) : null}
    </section>
  );
}
