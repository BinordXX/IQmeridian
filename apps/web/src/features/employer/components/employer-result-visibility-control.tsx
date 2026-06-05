type EmployerResultVisibilityControlProps = {
  campaignStatus: string;
};

export const EmployerResultVisibilityControl = ({
  campaignStatus,
}: EmployerResultVisibilityControlProps) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">
        Candidate result visibility
      </h3>

      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
        Candidate-facing result visibility is governed separately from
        employer-facing reporting. In the current MVP, employer reports remain
        available only to authorised employer users, while candidate result
        release remains restricted unless explicitly enabled by product rules.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="candidate-result-visibility"
            className="text-sm font-medium text-slate-700"
          >
            Candidate result access
          </label>

          <select
            id="candidate-result-visibility"
            value="hidden"
            disabled
            className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-500"
          >
            <option value="hidden">Hidden from candidate</option>
            <option value="summary">Limited summary visible</option>
          </select>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <p className="font-medium text-slate-950">Current campaign state</p>
          <p className="mt-1">{campaignStatus}</p>
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        This control is shown deliberately so the employer workspace is ready
        for campaign-level visibility governance, but it is disabled until the
        backend exposes a permitted setting for candidate result release.
      </p>
    </section>
  );
};
