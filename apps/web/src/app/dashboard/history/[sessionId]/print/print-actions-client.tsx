'use client';

import { Download, Printer } from 'lucide-react';
import { useEffect } from 'react';

type PrintActionsClientProps = {
  autoPrint: boolean;
};

export function PrintActionsClient({ autoPrint }: PrintActionsClientProps) {
  useEffect(() => {
    if (!autoPrint) return;

    const timeout = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [autoPrint]);

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
      <div>
        <p className="text-sm font-black text-slate-950">
          IQMeridian printable result
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Use Print for paper output or Save as PDF from your browser print
          dialog.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
          onClick={() => window.print()}
          type="button"
        >
          <Printer size={16} strokeWidth={2} />
          Print
        </button>

        <button
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-slate-50"
          onClick={() => window.print()}
          type="button"
        >
          <Download size={16} strokeWidth={2} />
          Save as PDF
        </button>
      </div>
    </div>
  );
}
