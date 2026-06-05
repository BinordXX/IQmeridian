'use client';

export const EmployerReportPrintButton = () => {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 print:hidden"
    >
      Print or save as PDF
    </button>
  );
};
