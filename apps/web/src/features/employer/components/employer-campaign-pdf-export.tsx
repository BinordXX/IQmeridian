'use client';

export const EmployerCampaignPdfExport = () => {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 print:hidden"
    >
      Print or save as PDF
    </button>
  );
};
