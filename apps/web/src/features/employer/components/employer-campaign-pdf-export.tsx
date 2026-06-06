'use client';

type EmployerCampaignPdfExportProps = {
  canExport: boolean;
};

export const EmployerCampaignPdfExport = ({
  canExport,
}: EmployerCampaignPdfExportProps) => {
  return (
    <div>
      <button
        type="button"
        onClick={() => window.print()}
        disabled={!canExport}
        className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 print:hidden"
      >
        Print or save as PDF
      </button>

      {!canExport ? (
        <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
          PDF export becomes meaningful after at least one completed candidate
          record exists.
        </p>
      ) : null}
    </div>
  );
};
